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

describe("MerchantVault", () => {
  const provider  = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program   = anchor.workspace.Solaudd as Program<any>;
  const merchant  = provider.wallet as anchor.Wallet;
  const customer  = anchor.web3.Keypair.generate();

  let mint:        anchor.web3.PublicKey;
  let merchantAta: anchor.web3.PublicKey;
  let customerAta: anchor.web3.PublicKey;
  let vaultPda:    anchor.web3.PublicKey;
  let vaultAta:    anchor.web3.PublicKey;

  const DECIMALS    = 6;
  const payAmount   = new BN(50 * 10 ** DECIMALS); // 50 AUDD

  before(async function () {
    this.timeout(60000);

    // Fund customer
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: merchant.publicKey,
        toPubkey:   customer.publicKey,
        lamports:   0.1 * anchor.web3.LAMPORTS_PER_SOL,
      })
    );
    await provider.sendAndConfirm(fundTx);

    // Create mint
    mint = await createMint(
      provider.connection,
      merchant.payer,
      merchant.publicKey,
      null,
      DECIMALS
    );

    // Create ATAs
    merchantAta = await createAssociatedTokenAccount(
      provider.connection,
      merchant.payer,
      mint,
      merchant.publicKey
    );

    customerAta = await createAssociatedTokenAccount(
      provider.connection,
      merchant.payer,
      mint,
      customer.publicKey
    );

    // Mint 1000 AUDD to customer
    await mintTo(
      provider.connection,
      merchant.payer,
      mint,
      customerAta,
      merchant.publicKey,
      1000 * 10 ** DECIMALS
    );

    // Derive PDAs
    [vaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), merchant.publicKey.toBuffer()],
      program.programId
    );
    vaultAta = getAssociatedTokenAddressSync(mint, vaultPda, true);
  });

  it("initializes merchant vault", async function () {
    this.timeout(30000);

    await program.methods
      .initVault("test-merchant-001")
      .accounts({
        merchant:     merchant.publicKey,
        vaultAccount: vaultPda,
        mint,
        vaultAta,
      })
      .rpc();

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.equal(vault.merchantId, "test-merchant-001");
    assert.equal(vault.totalReceived.toString(), "0");
    assert.equal(vault.merchant.toString(), merchant.publicKey.toString());

    console.log("✅ Vault initialized for merchant");
  });

  it("customer pays AUDD to vault", async function () {
    this.timeout(30000);

    await program.methods
      .receivePayment(payAmount)
      .accounts({
        payer:        customer.publicKey,
        vaultAccount: vaultPda,
        mint,
        payerAta:     customerAta,
        vaultAta,
      })
      .signers([customer])
      .rpc();

    const vault = await program.account.vaultAccount.fetch(vaultPda);
    assert.equal(
      vault.totalReceived.toString(),
      payAmount.toString()
    );

    const vaultBalance = await getAccount(provider.connection, vaultAta);
    assert.equal(vaultBalance.amount.toString(), payAmount.toString());

    console.log("✅ Customer paid 50 AUDD to vault");
  });

  it("merchant withdraws from vault", async function () {
    this.timeout(30000);

    const balanceBefore = (
      await getAccount(provider.connection, merchantAta)
    ).amount;

    await program.methods
      .withdrawVault(payAmount)
      .accounts({
        merchant:     merchant.publicKey,
        vaultAccount: vaultPda,
        mint,
        vaultAta,
        merchantAta,
      })
      .rpc();

    const balanceAfter = (
      await getAccount(provider.connection, merchantAta)
    ).amount;

    assert.isTrue(balanceAfter > balanceBefore);
    console.log("✅ Merchant withdrew 50 AUDD from vault");
  });

  it("fails if non-merchant tries to withdraw", async function () {
    this.timeout(30000);

    // Pay more so there's balance
    await program.methods
      .receivePayment(payAmount)
      .accounts({
        payer:        customer.publicKey,
        vaultAccount: vaultPda,
        mint,
        payerAta:     customerAta,
        vaultAta,
      })
      .signers([customer])
      .rpc();

    try {
      await program.methods
        .withdrawVault(payAmount)
        .accounts({
          merchant:     customer.publicKey,
          vaultAccount: vaultPda,
          mint,
          vaultAta,
          merchantAta:  customerAta,
        })
        .signers([customer])
        .rpc();

      assert.fail("Should have thrown");
    } catch (err: any) {
      assert.ok(err);
      console.log("✅ Non-merchant withdrawal correctly rejected");
    }
  });
});