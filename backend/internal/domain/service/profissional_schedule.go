package service

import (
	"strconv"
	"strings"
	"time"

	"espaco-terapia-os/backend/internal/domain/entity"
)

var weekdayToDiaAPI = []string{"dom", "seg", "ter", "qua", "qui", "sex", "sab"}

var diaAPINormalize = map[string]string{
	"dom": "dom", "domingo": "dom",
	"seg": "seg", "segunda": "seg",
	"ter": "ter", "terca": "ter", "terça": "ter",
	"qua": "qua", "quarta": "qua",
	"qui": "qui", "quinta": "qui",
	"sex": "sex", "sexta": "sex",
	"sab": "sab", "sabado": "sab", "sábado": "sab",
}

func normalizeDiaAPI(d string) string {
	key := strings.ToLower(strings.TrimSpace(d))
	if v, ok := diaAPINormalize[key]; ok {
		return v
	}
	return key
}

func parseClock(s string) (minutes int, ok bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, false
	}
	parts := strings.Split(s, ":")
	if len(parts) < 2 {
		return 0, false
	}
	h, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	m, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil || h < 0 || h > 23 || m < 0 || m > 59 {
		return 0, false
	}
	return h*60 + m, true
}

func profissionalAtendeNoDia(p *entity.Profissional, loc time.Time) bool {
	if p == nil || len(p.DiasAtendimento) == 0 {
		return false
	}
	want := weekdayToDiaAPI[int(loc.Weekday())]
	for _, d := range p.DiasAtendimento {
		if normalizeDiaAPI(d) == want {
			return true
		}
	}
	return false
}

func profissionalDentroDoExpediente(p *entity.Profissional, startLoc, endLoc time.Time) bool {
	if p == nil || p.HorarioInicio == nil || p.HorarioFim == nil {
		return true
	}
	startMin, ok1 := parseClock(*p.HorarioInicio)
	endMin, ok2 := parseClock(*p.HorarioFim)
	if !ok1 || !ok2 {
		return true
	}
	consultStart := startLoc.Hour()*60 + startLoc.Minute()
	consultEnd := endLoc.Hour()*60 + endLoc.Minute()
	return consultStart >= startMin && consultEnd <= endMin
}

func horariosSobrepostosConsulta(aStart, aEnd, bStart, bEnd time.Time) bool {
	return aStart.Before(bEnd) && bStart.Before(aEnd)
}
