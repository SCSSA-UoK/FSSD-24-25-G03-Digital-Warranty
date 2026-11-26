# Data Model

MongoDB is the primary persistence store. The application uses Spring Data MongoDB documents rather than relational entities.

## Entity inventory

### User
- Collection: `users`
- Key fields: id, name, email, emailNormalized, passwordHash, role, emailVerified, accountStatus
- Unique hints: normalized email
- References: one user may be a retailer, customer, or administrator

### Retailer
- Collection: `retailers`
- Key fields: id, userId, businessName, registrationNumber, approvalStatus, contactEmail, address
- Unique hint: userId
- References: User through userId

### Product
- Collection: `products`
- Key fields: id, retailerId, name, brand, model, warrantyDuration, warrantyUnit, stockQuantity, price
- Reference: Retailer through retailerId

### Purchase
- Collection: `purchases`
- Key fields: id, retailerId, purchaseReference, serialNumber, invoiceNumber, customerEmailNormalized, customerId
- Reference: Retailer and optionally User

### Warranty
- Collection: `warranties`
- Key fields: id, purchaseId, retailerId, customerId, productName, brand, model, serialNumber, startDate, expiryDate, qrToken, termsSnapshot
- Unique hints: purchaseId and qrToken
- References: Purchase, Retailer, and Customer

### Bill
- Collection: `bills`
- Key fields: id, invoiceNumber, retailerId, customerEmail, items, subtotal, taxAmount, grandTotal, paymentMethod
- Reference: Retailer

### BillItem
- Embedded/document field model for bill line items: productId, productName, quantity, unitPrice, lineTotal

### Claim
- Collection: `claims`
- Key fields: id, warrantyId, purchaseId, retailerId, customerId, issueDescription, evidenceReferences, currentStatus, resolutionType, serviceNotes
- References: Warranty, Purchase, Retailer, Customer

### ClaimStatusHistory
- Collection: `claim_status_history`
- Key fields: id, claimId, previousStatus, newStatus, changedBy, changedAt, note
- Reference: Claim through claimId

### Notification
- Collection: `notifications`
- Key fields: id, userId, type, message, relatedEntityId, relatedEntityType, isRead, createdAt
- Reference: User through userId

### AuditLog
- Collection: `audit_logs`
- Key fields: id, actorId, actorEmail, action, targetType, targetId, details, timestamp

### SecondaryEmail and AlternativeEmailVerification
- Collections: `secondary_emails` and `alternative_email_verifications`
- Used for alternate customer email ownership and purchase linking verification

## Key relationships
- User 1-to-0/1 Retailer through `Retailer.userId`
- Retailer 1-to-many Product, Purchase, Bill, and Claim
- Purchase 1-to-1 Warranty through `Warranty.purchaseId`
- Warranty 1-to-many Claim
- Claim 1-to-many ClaimStatusHistory
- User 1-to-many Notification
