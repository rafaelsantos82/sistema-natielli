package seedanamnese

import "encoding/json"

// TemplateFile is the on-disk JSON format for anamnese seeds.
type TemplateFile struct {
	Slug          string          `json:"slug"`
	Meta          TemplateMeta    `json:"meta"`
	Anamnese      AnamneseMeta    `json:"anamnese"`
	Questionnaire []QuestionItem  `json:"questionnaire"`
}

type TemplateMeta struct {
	SourceFile       string `json:"source_file"`
	ExtractedAt      string `json:"extracted_at,omitempty"`
	ExtractorVersion string `json:"extractor_version,omitempty"`
	ReviewStatus     string `json:"review_status,omitempty"`
}

type AnamneseMeta struct {
	Nome          string  `json:"nome"`
	Especialidade string  `json:"especialidade"`
	Versao        string  `json:"versao"`
	Status        string  `json:"status"`
	Observacoes   *string `json:"observacoes,omitempty"`
}

type QuestionItem struct {
	LinkID     string          `json:"linkId"`
	Text       string          `json:"text"`
	Type       string          `json:"type"`
	Required   bool            `json:"required,omitempty"`
	Options    []ChoiceOption  `json:"options,omitempty"`
	EnableWhen json.RawMessage `json:"enableWhen,omitempty"`
}

type ChoiceOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}
