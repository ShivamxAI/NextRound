from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import razorpay
import os
from app.core.firebase import db 
from app.core.security import get_current_user # Adjust to your auth dependency

router = APIRouter()

# Initialize the Razorpay Client
razorpay_client = razorpay.Client(
    auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET"))
)

# --- SCHEMAS ---
class CreateOrderRequest(BaseModel):
    plan: str
    amount: int

class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan: str

# --- ENDPOINTS ---

@router.post("/create-order")
async def create_order(request: CreateOrderRequest, user: dict = Depends(get_current_user)):
    """Creates a secure Razorpay order and returns the ID to React."""
    
    # Razorpay expects the amount in subunits (Paise for INR). So ₹99 = 9900 paise.
    amount_in_paise = request.amount * 100 

    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{user['uid'][:10]}_{request.plan}",
            "notes": {
                "user_id": user['uid'],
                "plan": request.plan
            }
        }
        
        # Ask Razorpay to generate the order
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
        
    except Exception as e:
        print(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    """Verifies the cryptograph signature from Razorpay and upgrades the user."""
    
    try:
        # 1. Verify the signature to ensure the payment is legitimate
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        # If this fails, it throws a SignatureVerificationError
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # 2. Signature is valid! Upgrade the user in Firestore!
        user_id = user["uid"]
        user_ref = db.collection("users").document(user_id)
        
        user_ref.update({
            "plan": request.plan,
            "subscription_status": "active"
        })
        
        # (Optional) You could also write a receipt to a 'transactions' collection here!
        
        return {"message": "Payment verified and user upgraded successfully!"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment signature verification failed. Possible tampering.")
    except Exception as e:
        print(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail="Failed to process payment upgrade")