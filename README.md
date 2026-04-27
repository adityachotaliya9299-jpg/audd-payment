# SolAUDD — Australian Dollar Infrastructure on Solana

<div align="center">

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana)
![Anchor](https://img.shields.io/badge/Anchor-0.31.1-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tests](https://img.shields.io/badge/Tests-16%20Passing-green?style=for-the-badge)

**Real-world AUDD stablecoin payments, streaming salaries, merchant vaults and business treasury — all on Solana.**

</div>

---

## What is SolAUDD

SolAUDD is a production-ready suite of 4 Anchor smart contracts that bring the Australian Digital Dollar (AUDD) to life on Solana. Every contract covers a real financial use case — from freelancer escrow payments to business payroll streaming.

---

## Deployed Program

| Item | Value |
|------|-------|
| Network | Solana Devnet |
| Program ID | `HHawtfSVhJ1hzRLewqquN6wUFTqhdfcZV2q35fqHermq` |
| AUDD Mint | `6n15Hkj7WDftaWfKg7Js869JrufdeoTC2WE12NkdZzPT` |
| AUDD Decimals | 6 |

---

## Smart Contracts

### PaymentEscrow
Lock AUDD in a PDA vault with a time-release condition. The recipient claims after the release window. The depositor can refund before it closes.

| Instruction | Description |
|-------------|-------------|
| `create_escrow` | Lock AUDD, set recipient and release time |
| `release_escrow` | Recipient claims after timelock passes |
| `refund_escrow` | Depositor reclaims AUDD before timelock |

---

### StreamPayment
Stream AUDD per second — real-time salary on-chain. Recipients withdraw earned AUDD at any time. Senders cancel and unearned funds return automatically.

| Instruction | Description |
|-------------|-------------|
| `create_stream` | Lock total AUDD, start drip per second |
| `withdraw_stream` | Recipient claims earned AUDD |
| `cancel_stream` | Stop stream, split earned vs unearned |

---

### MerchantVault
Merchants initialize a vault PDA and accept AUDD from any customer. A shareable QR code payment link enables instant on-chain payments.

| Instruction | Description |
|-------------|-------------|
| `init_vault` | Create merchant payment vault PDA |
| `receive_payment` | Customer pays AUDD to vault |
| `withdraw_vault` | Merchant pulls accumulated AUDD |

---

### TreasuryManager
Business AUDD treasury with on-chain accounting. Deposit funds, execute payments with memo logging, and track `total_in` / `total_out` transparently.

| Instruction | Description |
|-------------|-------------|
| `init_treasury` | Create business treasury PDA |
| `deposit_treasury` | Fund treasury from authority wallet |
| `execute_payment_treasury` | Pay recipient with memo |

---

## Frontend

Built with Next.js 16 and Tailwind CSS. Supports Phantom and Solflare wallets.

| Page | Route |
|------|-------|
| Landing | `/` |
| Payment Link | `/pay/new` |
| Salary Stream | `/stream` |
| Merchant Vault | `/merchant` |
| Treasury | `/treasury` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Contracts | Anchor 0.31.1 / Rust |
| Frontend | Next.js 16, Tailwind CSS |
| Wallet | Solana Wallet Adapter (Phantom + Solflare) |
| Token | SPL Token — AUDD (6 decimals) |
| Testing | Mocha + Chai |

---

## Project Structure

```
solaudd/
├── programs/solaudd/src/
│   ├── instructions/
│   │   ├── escrow.rs
│   │   ├── stream.rs
│   │   ├── vault.rs
│   │   └── treasury.rs
│   ├── state/
│   └── errors.rs
├── tests/
│   ├── escrow.test.ts
│   ├── stream.test.ts
│   ├── vault.test.ts
│   └── treasury.test.ts
└── app/
    └── src/
        ├── app/
        ├── components/
        ├── hooks/
        └── lib/
```

---

## Setup

### Prerequisites

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.31.1 && avm use 0.31.1

# Node 20+ and pnpm
npm i -g pnpm
```

### Install and build

```bash
git clone https://github.com/adityachotaliya9299-jpg/audd-payment
cd audd-payment

pnpm install
anchor build
```

### Run tests

```bash
anchor test --skip-deploy
```

### Deploy to devnet

```bash
solana config set --url devnet
solana airdrop 4
anchor deploy --provider.cluster devnet
cp target/idl/solaudd.json app/idl/
```

### Configure and start frontend

Create `app/.env.local`:
```
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=HHawtfSVhJ1hzRLewqquN6wUFTqhdfcZV2q35fqHermq
NEXT_PUBLIC_AUDD_MINT=<YOUR_MINT_ADDRESS>
NEXT_PUBLIC_AUDD_DECIMALS=6
```

```bash
cd app && pnpm dev
```

---

## Tests

```
PaymentEscrow
  ✔ creates escrow and locks AUDD
  ✔ releases escrow to recipient
  ✔ fails if wrong signer tries to release

StreamPayment
  ✔ creates stream and locks total AUDD
  ✔ recipient can withdraw earned AUDD
  ✔ fails if nothing to withdraw
  ✔ sender can cancel stream

MerchantVault
  ✔ initializes merchant vault
  ✔ customer pays AUDD to vault
  ✔ merchant withdraws from vault
  ✔ fails if non-merchant tries to withdraw

TreasuryManager
  ✔ initializes treasury
  ✔ deposits AUDD into treasury
  ✔ executes salary payment to employee
  ✔ tracks total_in and total_out correctly
  ✔ fails if non-authority tries to pay

16 passing
```

---

## Security

- PDA derivation with bump verification on every instruction
- CPI token transfers with proper PDA signer seeds
- Authority validation before every state mutation
- Overflow protection via `checked_mul` and `saturating_sub`
- Custom error codes for all failure conditions

---

## License

MIT

---

## Contact

**Aditya Chotaliya**
GitHub: [@adityachotaliya9299-jpg](https://github.com/adityachotaliya9299-jpg)
