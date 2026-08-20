package routes

import (
	"log/slog"
	"os"
	"strings"

	"espaco-terapia-os/backend/internal/application"
	"espaco-terapia-os/backend/internal/config"
	"espaco-terapia-os/backend/internal/domain/repository"
	"espaco-terapia-os/backend/internal/domain/service"
	"espaco-terapia-os/backend/internal/infrastructure/auth"
	"espaco-terapia-os/backend/internal/infrastructure/crypto"
	"espaco-terapia-os/backend/internal/infrastructure/database"
	"espaco-terapia-os/backend/internal/infrastructure/email"
	"espaco-terapia-os/backend/internal/infrastructure/storage"
	httplayer "espaco-terapia-os/backend/internal/interfaces/http"
	httphandler "espaco-terapia-os/backend/internal/interfaces/http/handlers"

	"gorm.io/gorm"
)

// ModuleDeps agrupa dependências compartilhadas para registro de rotas protegidas.
type ModuleDeps struct {
	DB                   *gorm.DB
	Logger               *slog.Logger
	ErrorHandler         *httplayer.ErrorHandler
	AuthorizationService *service.AccessControlService

	PacienteHandler             *httphandler.PacienteHandler
	UnidadeHandler              *httphandler.UnidadeHandler
	ProfissionalHandler         *httphandler.ProfissionalHandler
	ProfissionalDocumentoHandler *httphandler.ProfissionalDocumentoHandler
	ConsultaHandler             *httphandler.ConsultaHandler
	SalaHandler                 *httphandler.SalaHandler
	NotificationSettingsHandler *httphandler.NotificationSettingsHandler

	TerapiaHandler           *httphandler.TerapiaHandler
	AnamneseHandler             *httphandler.AnamneseHandler
	RespostaAnamneseHandler     *httphandler.RespostaAnamneseHandler
	FinanceiroHandler           *httphandler.FinanceiroHandler
	RelatorioOperacionalHandler *httphandler.RelatorioOperacionalHandler

	ProntuarioHandler *httphandler.ProntuarioHandler

	Wave3Handler         *httphandler.Wave3Handler
	AuditHandler         *httphandler.AuditHandler
	UserHandler          *httphandler.UserHandler
	AccessControlHandler *httphandler.AccessControlHandler
	BibliotecaDocumentoHandler *httphandler.BibliotecaDocumentoHandler
	ChaveDigitalHandler        *httphandler.ChaveDigitalHandler
	DocumentoAssinadoHandler   *httphandler.DocumentoAssinadoHandler
	ContratoHandler            *httphandler.ContratoHandler

	AuditService *service.AuditService
}

// NewModuleDeps constrói handlers de todos os módulos a partir do banco.
func NewModuleDeps(db *gorm.DB, logger *slog.Logger, errorHandler *httplayer.ErrorHandler, auditSvc *service.AuditService, frontendPublicURL string) ModuleDeps {
	userRepo := database.NewPostgresUserRepository(db)
	dataScopeRepo := database.NewPostgresDataScopeRepository(db)
	dataScopeSvc := service.NewDataScopeService(dataScopeRepo, userRepo)

	pacienteRepo := database.NewPostgresPacienteRepository(db)
	pacienteService := service.NewPacienteService(pacienteRepo, auditSvc)
	pacienteApp := application.NewPacienteApp(pacienteService)
	pacienteHandler := httphandler.NewPacienteHandler(pacienteApp, dataScopeSvc, errorHandler, logger)

	unidadeRepo := database.NewPostgresUnidadeRepository(db)
	unidadeService := service.NewUnidadeService(unidadeRepo, logger)
	unidadeApp := application.NewUnidadeApp(unidadeService)
	unidadeHandler := httphandler.NewUnidadeHandler(unidadeApp, errorHandler, logger)

	profissionalRepo := database.NewPostgresProfissionalRepository(db)
	profissionalService := service.NewProfissionalService(profissionalRepo, logger)
	profissionalApp := application.NewProfissionalApp(profissionalService)
	uploadBase := os.Getenv("UPLOAD_BASE_PATH")
	if strings.TrimSpace(uploadBase) == "" {
		uploadBase = "/data/uploads"
	}
	localStore, err := storage.NewLocalStorage(uploadBase)
	if err != nil {
		logger.Error("upload storage init failed", slog.String("error", err.Error()))
		panic(err)
	}
	uploadPolicy := service.LoadUploadPolicyFromEnv()
	docRepo := database.NewPostgresProfissionalDocumentoRepository(db)
	docSvc := service.NewProfissionalDocumentoService(docRepo, profissionalRepo, localStore, uploadPolicy, logger)
	docApp := application.NewProfissionalDocumentoApp(docSvc)
	docHandler := httphandler.NewProfissionalDocumentoHandler(docApp, errorHandler, logger)
	profissionalHandler := httphandler.NewProfissionalHandler(profissionalApp, errorHandler, logger)

	pacienteProfRepo := database.NewPostgresPacienteProfissionalRepository(db)
	pacienteProfSvc := service.NewPacienteProfissionalService(pacienteProfRepo, logger)

	consultaRepo := database.NewPostgresConsultaRepository(db)
	salaRepo := database.NewPostgresSalaRepository(db)
	consultaService := service.NewConsultaServiceWithProfissional(
		consultaRepo, salaRepo, profissionalRepo, pacienteProfSvc, logger,
	)
	consultaApp := application.NewConsultaApp(consultaService)
	consultaHandler := httphandler.NewConsultaHandler(consultaApp, dataScopeSvc, errorHandler, logger)

	salaService := service.NewSalaService(salaRepo, consultaRepo, logger)
	salaApp := application.NewSalaApp(salaService)
	salaHandler := httphandler.NewSalaHandler(salaApp, errorHandler, logger)

	notificationRepo := database.NewPostgresNotificationSettingsRepository(db)
	notificationService := service.NewNotificationSettingsService(notificationRepo, logger)
	notificationApp := application.NewNotificationSettingsApp(notificationService)
	notificationHandler := httphandler.NewNotificationSettingsHandler(notificationApp, errorHandler, logger)

	stores := database.NewWaveStores(db)

	terapiaSvc := service.NewTerapiaService(stores.Terapia, logger)
	terapiaApp := application.NewTerapiaApp(terapiaSvc)
	terapiaHandler := httphandler.NewTerapiaHandler(terapiaApp, errorHandler, logger)

	anamneseSvc := service.NewAnamneseService(stores.Anamnese, logger)
	anamneseApp := application.NewAnamneseApp(anamneseSvc)
	anamneseHandler := httphandler.NewAnamneseHandler(anamneseApp, errorHandler)

	respostaSvc := service.NewRespostaAnamneseService(stores.RespostaAnamnese, logger)
	respostaApp := application.NewRespostaAnamneseApp(respostaSvc)
	respostaHandler := httphandler.NewRespostaAnamneseHandler(respostaApp, dataScopeSvc, errorHandler)

	categoriaSvc := service.NewCategoriaFinanceiraService(stores.CategoriaFinanceira, logger)
	categoriaApp := application.NewCategoriaFinanceiraApp(categoriaSvc)
	centroSvc := service.NewCentroCustoService(stores.CentroCusto, logger)
	centroApp := application.NewCentroCustoApp(centroSvc)
	lancamentoSvc := service.NewLancamentoService(stores.Lancamento, logger)
	lancamentoApp := application.NewLancamentoApp(lancamentoSvc)
	financeiroHandler := httphandler.NewFinanceiroHandler(categoriaApp, centroApp, lancamentoApp, errorHandler)

	relatorioSvc := service.NewRelatorioOperacionalService(stores.RelatorioOperacional, logger)
	relatorioApp := application.NewRelatorioOperacionalApp(relatorioSvc)
	relatorioHandler := httphandler.NewRelatorioOperacionalHandler(relatorioApp, errorHandler)

	wave3Services := application.Wave3Services{
		FuncionarioCLT:      service.NewFuncionarioCLTService(stores.FuncionarioCLT, logger),
		FuncionarioPJ:       service.NewFuncionarioPJService(stores.FuncionarioPJ, logger),
		FolhaCLT:            service.NewFolhaCLTService(stores.FolhaCLT, logger),
		FolhaPJ:             service.NewFolhaPJService(stores.FolhaPJ, logger),
		ItemEstoque:         service.NewItemEstoqueService(stores.ItemEstoque, logger),
		MovimentacaoEstoque: service.NewMovimentacaoEstoqueService(stores.MovimentacaoEstoque, logger),
		Inventario:          service.NewInventarioService(stores.Inventario, logger),
		Comodato:            service.NewComodatoService(stores.Comodato, logger),
		PlanoSaude:          service.NewPlanoSaudeService(stores.PlanoSaude, logger),
		AcaoJudicial:        service.NewAcaoJudicialService(stores.AcaoJudicial, logger),
		NotaFiscal:          service.NewNotaFiscalService(stores.NotaFiscal, logger),
		Manual:              service.NewManualService(stores.Manual, localStore, uploadPolicy, logger),
		MaterialMarketing:   service.NewMaterialMarketingService(stores.MaterialMarketing, localStore, uploadPolicy, logger),
		ContaContabil:      service.NewContaContabilService(stores.ContaContabil, logger),
		LancamentoContabil: service.NewLancamentoContabilService(stores.LancamentoContabil, logger),
	}
	wave3Services.Balancete = service.NewBalanceteService(wave3Services.ContaContabil, wave3Services.LancamentoContabil)
	concRepo := database.NewPostgresConciliacaoRepository(db)
	conciliacaoSvc := service.NewConciliacaoService(stores.AcaoJudicial, stores.NotaFiscal, concRepo, logger)
	wave3Services.Conciliacao = conciliacaoSvc

	wave3Apps := application.NewWave3Apps(wave3Services)
	wave3Handler := httphandler.NewWave3Handler(
		wave3Apps,
		wave3Services.Manual,
		wave3Services.MaterialMarketing,
		conciliacaoSvc,
		errorHandler,
	)

	prontuarioRepo := database.NewPostgresProntuarioRepository(db)
	prontuarioSvc := service.NewProntuarioService(prontuarioRepo, logger)
	prontuarioApp := application.NewProntuarioApp(prontuarioSvc)
	prontuarioHandler := httphandler.NewProntuarioHandler(prontuarioApp, dataScopeSvc, errorHandler, logger)

	auditApp := application.NewAuditApp(auditSvc)
	auditHandler := httphandler.NewAuditHandler(auditApp, errorHandler)

	userService := service.NewUserService(userRepo, auditSvc, logger)
	userApp := application.NewUserApp(userService)
	userHandler := httphandler.NewUserHandler(userApp, errorHandler, logger)

	accessControlRepo := database.NewPostgresAccessControlRepository(db)
	accessControlService := service.NewAccessControlService(accessControlRepo, dataScopeRepo)
	accessControlApp := application.NewAccessControlApp(accessControlService)
	accessControlHandler := httphandler.NewAccessControlHandler(accessControlApp, errorHandler)

	bibCatRepo := database.NewPostgresDocumentoCategoriaRepository(db)
	bibArqRepo := database.NewPostgresBibliotecaArquivoRepository(db)
	bibSvc := service.NewBibliotecaDocumentoService(bibCatRepo, bibArqRepo, localStore, uploadPolicy, logger)
	bibApp := application.NewBibliotecaDocumentoApp(bibSvc)
	bibliotecaHandler := httphandler.NewBibliotecaDocumentoHandler(bibApp, errorHandler, logger)

	envelope, err := crypto.NewEnvelopeFromEnv()
	if err != nil {
		logger.Error("signing envelope init failed", slog.String("error", err.Error()))
		panic(err)
	}
	chaveRepo := database.NewPostgresChaveDigitalRepository(db)
	docAssinRepo := database.NewPostgresDocumentoAssinadoRepository(db)
	chaveSvc := service.NewChaveDigitalService(chaveRepo, envelope, auditSvc, logger)
	chaveApp := application.NewChaveDigitalApp(chaveSvc)
	chaveHandler := httphandler.NewChaveDigitalHandler(chaveApp, errorHandler)
	docAssinSvc := service.NewDocumentoAssinadoService(docAssinRepo, chaveSvc, localStore, auditSvc, logger)
	docAssinApp := application.NewDocumentoAssinadoApp(docAssinSvc)
	docAssinHandler := httphandler.NewDocumentoAssinadoHandler(docAssinApp, errorHandler)

	contratoRepo := database.NewPostgresContratoRepository(db)
	contratoSvc := service.NewContratoService(contratoRepo, localStore, service.ContratoUploadPolicy(), auditSvc, logger, frontendPublicURL)
	contratoApp := application.NewContratoApp(contratoSvc)
	contratoHandler := httphandler.NewContratoHandler(contratoApp, errorHandler)

	return ModuleDeps{
		DB:                          db,
		Logger:                      logger,
		ErrorHandler:                errorHandler,
		AuthorizationService:        accessControlService,
		PacienteHandler:             pacienteHandler,
		UnidadeHandler:              unidadeHandler,
		ProfissionalHandler:         profissionalHandler,
		ProfissionalDocumentoHandler: docHandler,
		ConsultaHandler:             consultaHandler,
		SalaHandler:                 salaHandler,
		NotificationSettingsHandler: notificationHandler,
		TerapiaHandler:              terapiaHandler,
		AnamneseHandler:             anamneseHandler,
		RespostaAnamneseHandler:     respostaHandler,
		FinanceiroHandler:           financeiroHandler,
		RelatorioOperacionalHandler: relatorioHandler,
		ProntuarioHandler:           prontuarioHandler,
		Wave3Handler:                wave3Handler,
		AuditHandler:                auditHandler,
		UserHandler:                 userHandler,
		AccessControlHandler:        accessControlHandler,
		BibliotecaDocumentoHandler:  bibliotecaHandler,
		ChaveDigitalHandler:         chaveHandler,
		DocumentoAssinadoHandler:    docAssinHandler,
		ContratoHandler:             contratoHandler,
		AuditService:                auditSvc,
	}
}

// NewAuthStack monta repositório, serviço e app de autenticação.
func NewAuthStack(db *gorm.DB, cfg *config.Config, jwtService *auth.JWTService, auditSvc *service.AuditService, accessSvc *service.AccessControlService) (*application.AuthApp, repository.UserRepository) {
	userRepo := database.NewPostgresUserRepository(db)
	protection := service.NewLoginProtectionService(
		database.NewPostgresLoginProtectionRepository(db),
		cfg.LoginMaxAttempts,
		cfg.LoginLockoutMinutes,
		cfg.LoginMaxAttempts*2,
		60,
	)
	mailer := email.NewResendClient(cfg.ResendAPIKey, cfg.EmailFrom, cfg.FrontendPublicURL)
	authSvc := service.NewAuthService(
		userRepo,
		jwtService,
		protection,
		auditSvc,
		database.NewPostgresPasswordResetRepository(db),
		mailer,
		accessSvc,
	)
	return application.NewAuthApp(authSvc), userRepo
}
