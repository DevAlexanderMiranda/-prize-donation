# -prize-donation

Simple prize donation system for my institution.

sistema-doacoes/
├── public/ # Arquivos estáticos
│ ├── images/ # Ícones/logo
│ └── favicon.ico
├── src/
│ ├── assets/
│ │ └── style.css # Estilos globais
│ ├── js/
│ │ ├── firebase-config.js # Config do Firebase
│ │ ├── auth.js # Autenticação
│ │ ├── db.js # Operações Firestore
│ │ └── admin.js # Lógica de aprovação
│ └── pages/
│ ├── auth/
│ │ ├── login.html # Página de login
│ │ └── register.html # Cadastro de usuários
│ ├── admin/
│ │ ├── dashboard.html # Painel de controle
│ │ ├── approve-users.html # Aprovar usuários
│ │ └── logs.html # Log de atividades
│ ├── donations/
│ │ ├── register.html # Cadastrar doação
│ │ └── list.html # Consultar doações
│ └── prizes/
│ ├── add.html # Cadastrar prêmio
│ └── categories.html # Gerenciar categorias
├── index.html # Home (redireciona para login)
└── README.md # Documentação
