import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";
import { SystemProgram, Transaction } from "@solana/web3.js";

describe("TreasuryManager", () => {
  const provider   = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program    = anchor.workspace.Solaudd as Program<any>;
  const payer      = provider.wallet as anchor.Wallet;

  // Fresh authority each run
  const authority  = anchor.web3.Keypair.generate();
  const employee   = anchor.web3.Keypair.generate();

  let mint:         anchor.web3.PublicKey;
  let authorityAta: anchor.web3.PublicKey;
  let employeeAta:  anchor.web3.PublicKey;
  let treasuryPda:  anchor.web3.PublicKey;
  let treasuryAta:  anchor.web3.PublicKey;

  const DECIMALS      = 6;
  const depositAmount = new BN(500 * 10 ** DECIMALS);
  const salaryAmount  = new BN(100 * 10 ** DECIMALS);

  before(async function () {
    this.timeout(60000);

    // Fund authority
    const fundTx = new Transaction()
      .add(SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey:   authority.publicKey,
        lamports:   0.5 * anchor.web3.LAMPORTS_PER_SOL,
      }))
      .add(SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey:   employee.publicKey,
        lamports:   0.05 * anchor.web3.LAMPORTS_PER_SOL,
      }));
    await provider.sendAndConfirm(fundTx);

    // Create mint
    mint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      DECIMALS
    );

    // Create authority ATA
    authorityAta = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      mint,
      authority.publicKey
    );

    // Create employee ATA
    employeeAta = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      mint,
      employee.publicKey
    );

    // Mint 1000 AUDD to authority
    await mintTo(
      provider.connection,
      payer.payer,
      mint,
      authorityAta,
      payer.publicKey,
      1000 * 10 ** DECIMALS
    );

    // Derive PDAs
    [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), authority.publicKey.toBuffer()],
      program.programId
    );
    treasuryAta = getAssociatedTokenAddressSync(mint, treasuryPda, true);
  });

  it("initializes treasury", async function () {
    this.timeout(30000);

    await program.methods
      .initTreasury("SolAUDD Corp Treasury")
      .accounts({
        authority:       authority.publicKey,
        treasuryAccount: treasuryPda,
        mint,
        treasuryAta,
      })
      .signers([authority])
      .rpc();

    const treasury = await program.account.treasuryAccount.fetch(treasuryPda);
    assert.equal(treasury.name, "SolAUDD Corp Treasury");
    assert.equal(treasury.totalIn.toString(), "0");
    assert.equal(treasury.totalOut.toString(), "0");

    console.log("✅ Treasury initialized: SolAUDD Corp Treasury");
  });

  it("deposits AUDD into treasury", async function () {
    this.timeout(30000);

    await program.methods
      .depositTreasury(depositAmount)
      .accounts({
        authority:       authority.publicKey,
        treasuryAccount: treasuryPda,
        mint,
        authorityAta,
        treasuryAta,
      })
      .signers([authority])
      .rpc();

    const treasury = await program.account.treasuryAccount.fetch(treasuryPda);
    assert.equal(treasury.totalIn.toString(), depositAmount.toString());

    const bal = await getAccount(provider.connection, treasuryAta);
    assert.equal(bal.amount.toString(), depositAmount.toString());

    console.log("✅ Deposited 500 AUDD into treasury");
  });

  it("executes salary payment to employee", async function () {
    this.timeout(30000);

    await program.methods
      .executeTreasuryPayment(salaryAmount, "April salary - Aditya")
      .accounts({
        authority:       authority.publicKey,
        treasuryAccount: treasuryPda,
        mint,
        treasuryAta,
        recipientAta:    employeeAta,
        recipient:       employee.publicKey,
      })
      .signers([authority])
      .rpc();

    const treasury = await program.account.treasuryAccount.fetch(treasuryPda);
    assert.equal(treasury.totalOut.toString(), salaryAmount.toString());

    const empBal = await getAccount(provider.connection, employeeAta);
    assert.equal(empBal.amount.toString(), salaryAmount.toString());

    console.log("✅ Paid 100 AUDD salary to employee");
  });

  it("tracks total_in and total_out correctly", async function () {
    this.timeout(30000);

    const treasury = await program.account.treasuryAccount.fetch(treasuryPda);
    const netBalance = treasury.totalIn.toNumber() - treasury.totalOut.toNumber();

    assert.equal(treasury.totalIn.toString(), depositAmount.toString());
    assert.equal(treasury.totalOut.toString(), salaryAmount.toString());
    assert.equal(netBalance, depositAmount.toNumber() - salaryAmount.toNumber());

    console.log(`✅ Accounting correct: ${netBalance / 10 ** DECIMALS} AUDD remaining`);
  });

  it("fails if non-authority tries to pay", async function () {
    this.timeout(30000);

    try {
      await program.methods
        .executeTreasuryPayment(salaryAmount, "hack attempt")
        .accounts({
          authority:       employee.publicKey,
          treasuryAccount: treasuryPda,
          mint,
          treasuryAta,
          recipientAta:    employeeAta,
          recipient:       employee.publicKey,
        })
        .signers([employee])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.ok(err);
      console.log("✅ Non-authority payment correctly rejected");
    }
  });
});