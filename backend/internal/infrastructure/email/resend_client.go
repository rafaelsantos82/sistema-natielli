package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	apiKey     string
	from       string
	frontendURL string
	httpClient *http.Client
}

func NewResendClient(apiKey, from, frontendURL string) *Client {
	return &Client{
		apiKey:      strings.TrimSpace(apiKey),
		from:        strings.TrimSpace(from),
		frontendURL: strings.TrimRight(strings.TrimSpace(frontendURL), "/"),
		httpClient:  &http.Client{Timeout: 15 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c.apiKey != "" && c.from != "" && c.frontendURL != ""
}

type sendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

func (c *Client) SendPasswordReset(ctx context.Context, toEmail, token string) error {
	if !c.Enabled() {
		return fmt.Errorf("email não configurado")
	}
	link := c.frontendURL + "/redefinir-senha?token=" + token
	body := fmt.Sprintf(`<p>Recebemos uma solicitação para redefinir sua senha no Espaço Terapia.</p>
<p><a href="%s">Redefinir senha</a></p>
<p>O link expira em 1 hora. Se você não solicitou, ignore este e-mail.</p>`, link)

	payload := sendRequest{
		From:    c.from,
		To:      []string{toEmail},
		Subject: "Redefinição de senha — Espaço Terapia",
		HTML:    body,
	}
	raw, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return fmt.Errorf("resend status %d", res.StatusCode)
	}
	return nil
}
