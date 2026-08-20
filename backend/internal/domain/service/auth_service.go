package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
	domainerrors "espaco-terapia-os/backend/internal/domain/errors"
	"espaco-terapia-os/backend/internal/domain/repository"
	infrauth "espaco-terapia-os/backend/internal/infrastructure/auth"
	"espaco-terapia-os/backend/internal/infrastructure/email"
	"espaco-terapia-os/backend/internal/platform/requestcontext"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12
const disabledPassword = "disabled"
const passwordResetTTL = time.Hour

type PasswordResetStore interface {
	Create(ctx context.Context, userID uuid.UUID, tokenHash string, expiresAt time.Time) error
	FindValidByHash(ctx context.Context, tokenHash string) (uuid.UUID, error)
	MarkUsed(ctx context.Context, tokenHash string) error
}

type AuthService struct {
	users      repository.UserRepository
	jwt        *infrauth.JWTService
	protection *LoginProtectionService
	audit      *AuditService
	resets     PasswordResetStore
	mailer     *email.Client
	access     *AccessControlService
}

func NewAuthService(
	users repository.UserRepository,
	jwt *infrauth.JWTService,
	protection *LoginProtectionService,
	audit *AuditService,
	resets PasswordResetStore,
	mailer *email.Client,
	access *AccessControlService,
) *AuthService {
	return &AuthService{
		users: users, jwt: jwt, protection: protection,
		audit: audit, resets: resets, mailer: mailer, access: access,
	}
}

func (s *AuthService) Login(ctx context.Context, email, password, clientIP string) (*LoginResult, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return nil, domainerrors.NewRequiredFieldError("email")
	}
	if password == "" {
		return nil, domainerrors.NewRequiredFieldError("password")
	}

	if s.protection != nil {
		if err := s.protection.CheckAllowed(ctx, email, clientIP); err != nil {
			return nil, err
		}
	}

	user, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if user == nil || !user.CanLogin() {
		s.recordLoginFailure(ctx, email, clientIP)
		return nil, domainerrors.NewUnauthorizedError("Credenciais inválidas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		s.recordLoginFailure(ctx, email, clientIP)
		return nil, domainerrors.NewUnauthorizedError("Credenciais inválidas")
	}

	if s.protection != nil {
		s.protection.OnSuccess(ctx, email, clientIP)
	}

	token, err := s.jwt.Generate(user.ID.String(), user.Email, string(user.Role), user.MustChangePassword)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao gerar token", err)
	}

	s.auditLogin(ctx, user, true)

	userDTO := ToUserDTO(user)
	if s.access != nil {
		if perms, permErr := s.access.ListRolePermissions(ctx, user.Role); permErr == nil {
			userDTO.Permissions = perms
		}
	}

	return &LoginResult{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   "configured_by_server",
		User:        userDTO,
	}, nil
}

func (s *AuthService) recordLoginFailure(ctx context.Context, email, clientIP string) {
	if s.protection != nil {
		_ = s.protection.OnFailure(ctx, email, clientIP)
	}
}

func (s *AuthService) auditLogin(ctx context.Context, user *entity.User, success bool) {
	if !success || s.audit == nil {
		return
	}
	ip, ua := auditMeta(ctx)
	RecordUserAudit(ctx, s.audit, user.ID, user.Name, string(user.Role), AuditUsuarioLogin, user.ID.String(),
		map[string]interface{}{"email": user.Email}, ip, ua)
}

func (s *AuthService) Logout(ctx context.Context, userID uuid.UUID, rawToken string) error {
	if s.jwt != nil && rawToken != "" {
		_ = s.jwt.Revoke(ctx, rawToken)
	}
	if s.audit != nil && userID != uuid.Nil {
		user, _ := s.users.FindByID(ctx, userID)
		name, role := "", ""
		if user != nil {
			name, role = user.Name, string(user.Role)
		}
		ip, ua := auditMeta(ctx)
		RecordUserAudit(ctx, s.audit, userID, name, role, AuditUsuarioLogout, userID.String(), nil, ip, ua)
	}
	return nil
}

func (s *AuthService) GetProfile(ctx context.Context, userID uuid.UUID) (*UserDTO, error) {
	if userID == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("user_id")
	}
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil || user.DeletedAt != nil {
		return nil, domainerrors.NewUnauthorizedError("Usuário não encontrado")
	}
	profile := ToUserDTO(user)
	if s.access != nil {
		perms, err := s.access.ListRolePermissions(ctx, user.Role)
		if err != nil {
			return nil, err
		}
		profile.Permissions = perms
	}
	return profile, nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, in UpdateProfileInput) (*UserDTO, error) {
	if userID == uuid.Nil {
		return nil, domainerrors.NewRequiredFieldError("user_id")
	}
	name := strings.TrimSpace(in.Name)
	email := normalizeEmail(in.Email)
	if name == "" {
		return nil, domainerrors.NewRequiredFieldError("name")
	}
	if email == "" {
		return nil, domainerrors.NewRequiredFieldError("email")
	}

	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil || user.DeletedAt != nil {
		return nil, domainerrors.NewUnauthorizedError("Usuário não encontrado")
	}

	other, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if other != nil && other.ID != userID && other.DeletedAt == nil {
		return nil, domainerrors.NewConflictError("E-mail já cadastrado")
	}

	before := UserAuditSnapshotFrom(user)
	user.Name = name
	user.Email = email
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}

	if s.audit != nil {
		ip, ua := auditMeta(ctx)
		RecordUserAudit(ctx, s.audit, userID, user.Name, string(user.Role), AuditUsuarioEdicao, userID.String(),
			map[string]interface{}{"before": before, "after": UserAuditSnapshotFrom(user)}, ip, ua)
	}

	return s.GetProfile(ctx, userID)
}

func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return domainerrors.NewRequiredFieldError("email")
	}
	if s.protection != nil {
		if err := s.protection.CheckAllowed(ctx, email, requestcontext.ClientIP(ctx)); err != nil {
			return err
		}
	}

	user, err := s.users.FindByEmail(ctx, email)
	if err != nil || user == nil || !user.CanLogin() {
		return nil
	}

	token, hash, err := generateResetToken()
	if err != nil {
		return domainerrors.NewDatabaseError("falha ao gerar token", err)
	}
	if s.resets != nil {
		if err := s.resets.Create(ctx, user.ID, hash, time.Now().UTC().Add(passwordResetTTL)); err != nil {
			return err
		}
	}
	if s.mailer != nil && s.mailer.Enabled() {
		_ = s.mailer.SendPasswordReset(ctx, user.Email, token)
	}
	ip, ua := auditMeta(ctx)
	RecordUserAudit(ctx, s.audit, entity.SystemUserID, "Sistema", "admin", AuditUsuarioResetSenhaSolicitado, user.ID.String(),
		map[string]interface{}{"email": user.Email}, ip, ua)
	return nil
}

func (s *AuthService) ResetPassword(ctx context.Context, token, password string) error {
	if strings.TrimSpace(token) == "" {
		return domainerrors.NewRequiredFieldError("token")
	}
	hash := hashResetToken(token)
	if s.resets == nil {
		return domainerrors.NewValidationError("reset indisponível")
	}
	userID, err := s.resets.FindValidByHash(ctx, hash)
	if err != nil {
		return err
	}
	if userID == uuid.Nil {
		return domainerrors.NewValidationError("token inválido ou expirado")
	}
	user, err := s.users.FindByID(ctx, userID)
	if err != nil || user == nil {
		return domainerrors.NewValidationError("token inválido ou expirado")
	}

	pwHash, err := HashPassword(password)
	if err != nil {
		return err
	}
	user.PasswordHash = pwHash
	user.MustChangePassword = false
	if err := s.users.Update(ctx, user); err != nil {
		return err
	}
	_ = s.resets.MarkUsed(ctx, hash)
	ip, ua := auditMeta(ctx)
	RecordUserAudit(ctx, s.audit, userID, user.Name, string(user.Role), AuditUsuarioResetSenhaConcluido, userID.String(), nil, ip, ua)
	return nil
}

func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) (*LoginResult, error) {
	user, err := s.users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil || user.DeletedAt != nil {
		return nil, domainerrors.NewUnauthorizedError("Usuário não encontrado")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
		return nil, domainerrors.NewUnauthorizedError("Senha atual incorreta")
	}
	pwHash, err := HashPassword(newPassword)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = pwHash
	user.MustChangePassword = false
	if err := s.users.Update(ctx, user); err != nil {
		return nil, err
	}
	token, err := s.jwt.Generate(user.ID.String(), user.Email, string(user.Role), false)
	if err != nil {
		return nil, domainerrors.NewDatabaseError("falha ao gerar token", err)
	}
	ip, ua := auditMeta(ctx)
	RecordUserAudit(ctx, s.audit, userID, user.Name, string(user.Role), AuditUsuarioSenhaAlterada, userID.String(), nil, ip, ua)
	userDTO := ToUserDTO(user)
	if s.access != nil {
		if perms, permErr := s.access.ListRolePermissions(ctx, user.Role); permErr == nil {
			userDTO.Permissions = perms
		}
	}
	return &LoginResult{
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   "configured_by_server",
		User:        userDTO,
	}, nil
}

var passwordHasDigit = regexp.MustCompile(`\d`)

func HashPassword(password string) (string, error) {
	if len(password) < 8 {
		return "", domainerrors.NewValidationError("senha deve ter no mínimo 8 caracteres")
	}
	if !passwordHasDigit.MatchString(password) {
		return "", domainerrors.NewValidationError("A senha deve incluir pelo menos um número")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", domainerrors.NewDatabaseError("falha ao processar senha", err)
	}
	return string(hash), nil
}

func IsDisabledPassword(hash string) bool {
	return hash == "" || hash == disabledPassword
}

func generateResetToken() (plain, hash string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	plain = hex.EncodeToString(b)
	return plain, hashResetToken(plain), nil
}

func hashResetToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

func auditMeta(ctx context.Context) (*string, *string) {
	ip := requestcontext.ClientIP(ctx)
	ua := requestcontext.UserAgent(ctx)
	var ipPtr, uaPtr *string
	if ip != "" {
		ipPtr = &ip
	}
	if ua != "" {
		uaPtr = &ua
	}
	return ipPtr, uaPtr
}
