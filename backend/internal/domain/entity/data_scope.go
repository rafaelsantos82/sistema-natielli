package entity

// Data scope codes (role_resource_scopes.scope_code).
const (
	DataScopeAll              = "all"
	DataScopeSelfPatient      = "self_patient"
	DataScopeTherapistPatients = "therapist_patients"
	DataScopeUnitPatients     = "unit_patients"
)

// Clinical resources subject to row-level scope enforcement.
var ScopedClinicalResources = []string{
	"pacientes",
	"consultas",
	"prontuario",
	"anamneses",
	"terapias",
}

func DataScopeValid(code string) bool {
	switch code {
	case DataScopeAll, DataScopeSelfPatient, DataScopeTherapistPatients, DataScopeUnitPatients:
		return true
	default:
		return false
	}
}
