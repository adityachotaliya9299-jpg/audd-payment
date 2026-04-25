import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Solaudd } from "../target/types/solaudd";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("PaymentEscrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Solaudd as Program<Solaudd>;
  const depositor = provider.wallet as anchor.Wallet;
  const recipient  = anchor.web3.Keypair.generate();

  let mint:          anchor.web3.PublicKey;
  let depositorAta:  anchor.web3.PublicKey;
  let recipientAta:  anchor.web3.PublicKey;
  let escrowPda:     anchor.web3.PublicKey;
  let vaultAta:      anchor.web3.PublicKey;

  const AUDD_DECIMALS = 6;
  const escrowAmount  = new BN(100 * 10 ** AUDD_DECIMALS); // 100 AUDD

  before(async () => {
    // Airdrop SOL to recipient
    await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise(r => setTimeout(r, 1000));

    // Create mock AUDD mint
    mint = await createMint(
      provider.connection,
      (depositor.payer as anchor.web3.Keypair),
      depositor.publicKey,
      null,
      AUDD_DECIMALS
    );

    // Create ATAs
    depositorAta = await createAssociatedTokenAccount(
      provider.connection,
      (depositor.payer as anchor.web3.Keypair),
      mint,
      depositor.publicKey
    );

    recipientAta = await createAssociatedTokenAccount(
      provider.connection,
      (depositor.payer as anchor.web3.Keypair),
      mint,
      recipient.publicKey
    );

    // Mint 1000 AUDD to depositor
    await mintTo(
      provider.connection,
      (depositor.payer as anchor.web3.Keypair),
      mint,
      depositorAta,
      depositor.publicKey,
      1000 * 10 ** AUDD_DECIMALS
    );

    // Derive escrow PDA
    [escrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        depositor.publicKey.toBuffer(),
        recipient.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Derive vault ATA
    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
    vaultAta = getAssociatedTokenAddressSync(mint, escrowPda, true);
  });

  it("creates escrow and locks AUDD", async () => {
    const releaseTime = new BN(Math.floor(Date.now() / 1000) - 10); // past = immediate release

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
    assert.equal(escrow.recipient.toString(), recipient.publicKey.toString());
    assert.equal(escrow.isReleased, false);
    assert.equal(escrow.isRefunded, false);

    const vault = await getAccount(provider.connection, vaultAta);
    assert.equal(vault.amount.toString(), escrowAmount.toString());

    console.log("✅ Escrow created — 100 AUDD locked in vault");
  });

  it("releases escrow to recipient", async () => {
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

    console.log("✅ Escrow released — 100 AUDD sent to recipient");
  });

  it("fails if wrong recipient tries to release", async () => {
    const fakeRecipient = anchor.web3.Keypair.generate();
    const newRecipient  = anchor.web3.Keypair.generate();

    await provider.connection.requestAirdrop(
      fakeRecipient.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise(r => setTimeout(r, 1000));

    const releaseTime = new BN(Math.floor(Date.now() / 1000) - 10);

    const [newEscrowPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        depositor.publicKey.toBuffer(),
        newRecipient.publicKey.toBuffer(),
      ],
      program.programId
    );

    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
    const newVaultAta = getAssociatedTokenAddressSync(mint, newEscrowPda, true);

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
      const fakeAta = getAssociatedTokenAddressSync(
        mint, fakeRecipient.publicKey
      );
      await program.methods
        .releaseEscrow()
        .accounts({
          recipient:     fakeRecipient.publicKey,
          escrowAccount: newEscrowPda,
          mint,
          vaultAta:      newVaultAta,
          recipientAta:  fakeAta,
        })
        .signers([fakeRecipient])
        .rpc();

      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "Error");
      console.log("✅ Wrong recipient correctly rejected");
    }
  });

  it("fails to release twice", async () => {
    try {
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
      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.include(err.toString(), "Error");
      console.log("✅ Double release correctly rejected");
    }
  });
});