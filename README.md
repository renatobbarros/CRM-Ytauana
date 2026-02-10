# 🦷 Ytauana CRM - Desktop Management System

![Project Status](https://img.shields.io/badge/Status-Development-cyan)
![Electron](https://img.shields.io/badge/Electron-30.0.1-blue)
![React](https://img.shields.io/badge/React-18.2.0-blueviolet)
![SQLite](https://img.shields.io/badge/Database-SQLite-emerald)

A high-performance, visually stunning desktop CRM tailored for dental clinics and personalized for **Ytauana**. Built with a focus on seamless clinical management, financial tracking, and sales pipeline evolution.

---

## 🚀 Principais Funcionalidades

### 📅 Agenda Clínica Inteligente
- Gestão de consultas e procedimentos com interface visual intuitiva.
- **Recorrência Personalizada:** Suporte a agendamentos semanais e mensais.
- **Vínculo Financeiro:** Integração direta entre agendamentos clínicos e controle de pagamentos.
- **Limite de Recorrência:** Definição exata de data final para parcelas recorrentes.

### 💰 Gestão Financeira Avançada
- **Gerador de Pagamentos Customizados:** Crie planos de pagamento automáticos com intervalos de dias personalizados.
- **Toggle de Status:** Alternância rápida entre 'Pago' e 'Pendente' diretamente na listagem.
- **Rastreamento de Inadimplência:** Identificação visual de pagamentos em atraso.

### 📊 Funil de Processos (Kanban)
- Gerenciamento de leads e planos de tratamento em estilo Kanban.
- **Conversão Direta:** Transforme um lead em um agendamento clínico com apenas um clique.
- Movimentação fluida entre estágios: Lead → Contato → Orçamento → Negociação → Fechado.

### 💎 UI/UX Pro Max
- Tema personalizado `DentalCare Cyan`: estética médica, limpa e moderna.
- Totalmente responsivo e otimizado para interação Desktop.
- Tipografia premium (Figtree/Noto Sans) e micro-animações.

---

## 🛠️ Tech Stack

- **Core:** Electron + React 18 + TypeScript
- **Styling:** TailwindCSS + Shadcn/UI (Radix)
- **Database:** SQLite (Better-SQLite3)
- **Navigation:** React Router Dom
- **State:** Zustand
- **Charts:** Recharts

---

## 💻 Como Executar

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn
- Build Tools (no Windows: `npm install --global --production windows-build-tools` para compilar o SQLite)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ytauana-crm.git
cd ytauana-crm/WindowsCRM
```

2. Instale as dependências:
```bash
npm install
```

3. Execute em modo desenvolvimento:
```bash
npm run dev
```

### Gerar Executável (.exe)
Existem duas formas de gerar o instalador:

#### 1. Via GitHub Actions (Recomendado 🚀)
Como o repositório está configurado com automação, você não precisa instalar nada no seu computador:
1. Faça o `git push` do seu código para o GitHub.
2. No seu repositório, clique na aba **"Actions"**.
3. Selecione o workflow **"Build and Release Ytauana CRM"**.
4. Assim que terminar, clique na execução e baixe o arquivo em **"Artifacts"** no final da página.

#### 2. Manualmente (Local)
Para gerar o standalone na sua máquina:
```bash
npm run build
```
O executável será gerado na pasta `dist`. *Nota: Requer ferramentas de compilação C++ instaladas no Windows.*

---

## 👤 Autor
Desenvolvido para **Ytauana - Proprietária**.

---

## 📄 Licença
Este projeto é privado para uso exclusivo do cliente.