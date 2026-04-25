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

describe("PaymentEscrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program  = anchor.workspace.Solaudd as Program<any>;
  const depositor = provider.wallet as anchor.Wallet;
  const recipient  = anchor.web3.Keypair.generate();

  let mint:         anchor.web3.PublicKey;
  let depositorAta: anchor.web3.PublicKey;
  let recipientAta: anchor.web3.PublicKey;
  let escrowPda:    anchor.web3.PublicKey;
  let vaultAta:     anchor.web3.PublicKey;

  const DECIMALS     = 6;
  const escrowAmount = new BN(100 * 10 ** DECIMALS);

  before(async function() {
    this.timeout(60000);

    // Fund recipient with SOL from depositor
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: depositor.publicKey,
        toPubkey:   recipient.publicKey,
        lamports:   0.1 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(fundTx);

    // Create mint
    mint = await createMint(
      provider.connection,
      depositor.payer,
      depositor.publicKey,
      null,
      DECIMALS
    );

    // Create ATAs
    depositorAta = await createAssociatedTokenAccount(
      provider.connection,
      depositor.payer,
      mint,
      depositor.publicKey
    );

    recipientAta = await createAssociatedTokenAccount(
      provider.connection,
      depositor.payer,
      mint,
      recipient.publicKey
    );

    // Mint 1000 AUDD to depositor
    await mintTo(
      provider.connection,
      depositor.payer,
      mint,
      depositorAta,
      depositor.publicKey,
      1000 * 10 ** DECIMALS
    );

    // Derive PDAs
    [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), depositor.publicKey.toBuffer(), recipient.publicKey.toBuffer()],
      program.programId
    );
    vaultAta = getAssociatedTokenAddressSync(mint, escrowPda, true);
  });

  it("creates escrow and locks AUDD", async function() {
    this.timeout(30000);
    const releaseTime = new BN(Math.floor(Date.now() / 1000) - 10);

    await program.methods
      .createEscrow(escrowAmount, releaseTime, recipient.publicKey)
      .accounts({
        depositor:     depositor.publicKey,
        escrowAccount: escrowPda,
        mint,
        depositorAta,
        vaultAta,
      })
      .rpc();

    const escrow = await program.account.escrowAccount.fetch(escrowPda);
    assert.equal(escrow.amount.toString(), escrowAmount.toString());
    assert.equal(escrow.isReleased, false);
    console.log("Escrow created — 100 AUDD locked");
  });

  it("releases escrow to recipient", async function() {
    this.timeout(30000);

    await program.methods
      .releaseEscrow()
      .accounts({
        recipient:     recipient.publicKey,
        escrowAccount: escrowPda,
        mint,
        vaultAta,
        recipientAta,
      })
      .signers([recipient])
      .rpc();

    const escrow = await program.account.escrowAccount.fetch(escrowPda);
    assert.equal(escrow.isReleased, true);

    const recipientAccount = await getAccount(provider.connection, recipientAta);
    assert.equal(recipientAccount.amount.toString(), escrowAmount.toString());
    console.log("Escrow released — 100 AUDD sent to recipient");
  });

  it("fails if wrong signer tries to release", async function() {
    this.timeout(30000);
    const fakeUser      = anchor.web3.Keypair.generate();
    const newRecipient  = anchor.web3.Keypair.generate();

    // Fund fakeUser
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: depositor.publicKey,
        toPubkey:   fakeUser.publicKey,
        lamports:   0.05 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(fundTx);

    const [newEscrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), depositor.publicKey.toBuffer(), newRecipient.publicKey.toBuffer()],
      program.programId
    );
    const newVaultAta    = getAssociatedTokenAddressSync(mint, newEscrowPda, true);
    const newRecipientAta = getAssociatedTokenAddressSync(mint, newRecipient.publicKey);
    const releaseTime     = new BN(Math.floor(Date.now() / 1000) - 10);

    await program.methods
      .createEscrow(escrowAmount, releaseTime, newRecipient.publicKey)
      .accounts({
        depositor:     depositor.publicKey,
        escrowAccount: newEscrowPda,
        mint,
        depositorAta,
        vaultAta: newVaultAta,
      })
      .rpc();

    try {
      await program.methods
        .releaseEscrow()
        .accounts({
          recipient:     fakeUser.publicKey,
          escrowAccount: newEscrowPda,
          mint,
          vaultAta:      newVaultAta,
          recipientAta:  newRecipientAta,
        })
        .signers([fakeUser])
        .rpc();
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.ok(err);
      console.log("Wrong signer correctly rejected");
    }
  });
});