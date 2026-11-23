# FictiBank V7.1 Online

Simulador bancário fictício. O Pix é apenas uma transferência entre contas do próprio aplicativo; não usa Pix real, bancos, dinheiro real ou instituições financeiras.

## O que tem
- Login do Bruno e do Irmão
- Saldo armazenado no servidor
- Chaves Pix fictícias
- Pix entre dispositivos diferentes quando ambos acessam a mesma instalação online
- ID de transação
- Extrato
- Adição de dinheiro fictício
- Interface mobile moderna

## Contas de teste
- Bruno — PIN 1234 — `bruno@fictibank`
- Irmão — PIN 4321 — `irmao@fictibank`

## Rodar localmente
1. Instale Node.js.
2. Abra esta pasta no terminal.
3. Rode `npm install`
4. Rode `npm start`
5. Acesse `http://localhost:3000`

Importante: não abra `public/index.html` diretamente. O frontend precisa ser servido pelo `server.js`.

## Colocar online
Você precisa de uma hospedagem que execute Node.js e mantenha um disco/banco persistente. Depois de publicar, o endereço HTTPS da aplicação será o mesmo usado pelos dois celulares.

Exemplo de fluxo:
celular 1 → HTTPS do FictiBank → servidor + SQLite → celular 2

## Observação sobre o SQLite
O arquivo `fictibank.db` guarda os saldos e transações. Em hospedagens com disco temporário, os dados podem ser perdidos quando o serviço reinicia/redeploya. Para uso online mais duradouro, use armazenamento persistente ou troque o banco por PostgreSQL.

Este projeto é uma brincadeira/simulação.
