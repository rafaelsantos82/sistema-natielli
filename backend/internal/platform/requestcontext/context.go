package requestcontext

import "context"

type ctxKey string

const (
	keyClientIP    ctxKey = "client_ip"
	keyUserAgent   ctxKey = "user_agent"
	keyActorID     ctxKey = "actor_id"
	keyActorName   ctxKey = "actor_name"
	keyActorRole   ctxKey = "actor_role"
)

func WithClientIP(ctx context.Context, ip string) context.Context {
	return context.WithValue(ctx, keyClientIP, ip)
}

func ClientIP(ctx context.Context) string {
	if v, ok := ctx.Value(keyClientIP).(string); ok {
		return v
	}
	return ""
}

func WithUserAgent(ctx context.Context, ua string) context.Context {
	return context.WithValue(ctx, keyUserAgent, ua)
}

func UserAgent(ctx context.Context) string {
	if v, ok := ctx.Value(keyUserAgent).(string); ok {
		return v
	}
	return ""
}

func WithActor(ctx context.Context, id, name, role string) context.Context {
	ctx = context.WithValue(ctx, keyActorID, id)
	ctx = context.WithValue(ctx, keyActorName, name)
	ctx = context.WithValue(ctx, keyActorRole, role)
	return ctx
}

func ActorFromContext(ctx context.Context) (id, name, role string) {
	id, _ = ctx.Value(keyActorID).(string)
	name, _ = ctx.Value(keyActorName).(string)
	role, _ = ctx.Value(keyActorRole).(string)
	return id, name, role
}
