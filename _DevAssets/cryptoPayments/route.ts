import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPolygonUSDCTransaction } from '@/lib/transaction-verification';

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser(request);

    if (error || !user) {
      return NextResponse.json(
        { error: error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID (hash) is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Get current user
    const currentUser = await User.findById(user.userId);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only individual and team users with pending status can verify
    if (currentUser.accountType !== 'individual' && currentUser.accountType !== 'team') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (currentUser.status !== 'pending') {
      return NextResponse.json(
        { error: 'User is not in pending status' },
        { status: 400 }
      );
    }

    // Check if transaction ID is already used (must be unique)
    const existingUserWithTxId = await User.findOne({ 
      reg_tx_id: transactionId,
      _id: { $ne: currentUser._id }
    });

    if (existingUserWithTxId) {
      return NextResponse.json(
        { error: 'Transaction ID is already used' },
        { status: 400 }
      );
    }

    // Find admin user to get registration amount and wallet info
    const admin = await User.findOne({ accountType: 'admin' });
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin configuration not found' },
        { status: 404 }
      );
    }

    if (!admin.wallet?.address || !admin.wallet?.network) {
      return NextResponse.json(
        { error: 'Admin wallet is not configured' },
        { status: 400 }
      );
    }

    // Get the appropriate registration amount based on user's account type
    const requiredAmount = currentUser.accountType === 'individual' 
      ? admin.individual_reg_amount || 0
      : admin.team_reg_amount || 0;

    if (requiredAmount <= 0) {
      return NextResponse.json(
        { error: 'Registration amount is not configured' },
        { status: 400 }
      );
    }

    // Use Etherscan API to verify transaction
    try {
      const adminAddress = admin.wallet.address;
      const adminNetwork = admin.wallet.network;

      // Verify transaction using Etherscan API
      const verificationResult = await verifyPolygonUSDCTransaction(
        transactionId,
        adminAddress,
        adminNetwork,
        12 // minConfirmations
      );

      // Extract payment details from verification result
      const paidAmount = verificationResult.amount;
      const transactionRecipient = verificationResult.to;

      console.log('transactionRecipient: ', transactionRecipient);
      console.log('adminAddress: ', adminAddress);
      console.log('paidAmount: ', paidAmount);
      console.log('confirmations: ', verificationResult.confirmations);
      console.log('confirmed: ', verificationResult.confirmed);

      // Check if transaction has enough confirmations
      if (!verificationResult.confirmed) {
        return NextResponse.json(
          { error: `Transaction needs more confirmations. Current: ${verificationResult.confirmations}, Required: ${verificationResult.requiredConfirmations}` },
          { status: 400 }
        );
      }

      // Verify paid amount >= required amount
      if (paidAmount < requiredAmount) {
        return NextResponse.json(
          { error: `Paid amount (${paidAmount}) is less than required amount (${requiredAmount})` },
          { status: 400 }
        );
      }

      // Update user: set transaction info and activate status
      currentUser.reg_tx_id = transactionId;
      currentUser.reg_tx_amount = paidAmount;
      currentUser.status = 'active';
      await currentUser.save();

      return NextResponse.json({
        success: true,
        message: 'Transaction verified successfully. Your account is now active.',
        user: {
          _id: currentUser._id.toString(),
          name: currentUser.name,
          email: currentUser.email,
          accountType: currentUser.accountType,
          status: currentUser.status,
        },
        transactionDetails: {
          paidAmount,
          requiredAmount,
          transactionHash: transactionId,
          confirmations: verificationResult.confirmations,
          requiredConfirmations: verificationResult.requiredConfirmations,
        },
      });
    } catch (verificationError: any) {
      console.error('Transaction verification error:', verificationError);
      return NextResponse.json(
        { error: `Transaction verification failed: ${verificationError.message || 'Invalid transaction or network error'}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Verify transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify transaction' },
      { status: 500 }
    );
  }
}

