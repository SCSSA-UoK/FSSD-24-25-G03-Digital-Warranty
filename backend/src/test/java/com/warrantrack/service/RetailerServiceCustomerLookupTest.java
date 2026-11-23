package com.warrantrack.service;

import com.warrantrack.dto.retailer.CustomerLookupResponse;
import com.warrantrack.model.Bill;
import com.warrantrack.model.Purchase;
import com.warrantrack.model.Retailer;
import com.warrantrack.model.User;
import com.warrantrack.model.enums.ApprovalStatus;
import com.warrantrack.model.enums.Role;
import com.warrantrack.repository.BillRepository;
import com.warrantrack.repository.PurchaseRepository;
import com.warrantrack.repository.RetailerRepository;
import com.warrantrack.repository.UserRepository;
import com.warrantrack.repository.WarrantyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RetailerServiceCustomerLookupTest {

    @Mock
    private RetailerRepository retailerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BillRepository billRepository;

    @Mock
    private WarrantyRepository warrantyRepository;

    @Mock
    private PurchaseRepository purchaseRepository;

    @InjectMocks
    private RetailerService retailerService;

    private Retailer retailerA;
    private Retailer retailerB;
    private User customer1;
    private User customer2;

    @BeforeEach
    void setUp() {
        retailerA = Retailer.builder()
                .id("retailer-A")
                .userId("user-retailer-A")
                .businessName("Boutique Alpha")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        retailerB = Retailer.builder()
                .id("retailer-B")
                .userId("user-retailer-B")
                .businessName("Retailer Beta")
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        customer1 = User.builder()
                .id("cust-1")
                .name("Alice Wonder")
                .email("alice@alpha.com")
                .emailNormalized("alice@alpha.com")
                .phone("1112223333")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();

        customer2 = User.builder()
                .id("cust-2")
                .name("Bob Builder")
                .email("bob@beta.com")
                .emailNormalized("bob@beta.com")
                .phone("4445556666")
                .role(Role.CUSTOMER)
                .emailVerified(true)
                .build();
    }

    @Test
    @DisplayName("Multi-tenant isolation: Retailer A only sees customers who transacted with Retailer A")
    void testLookupCustomers_EnforcesMultiTenantIsolation() {
        when(retailerRepository.findByUserId("user-retailer-A")).thenReturn(Optional.of(retailerA));

        // Retailer A has transactions with Customer 1 only
        Bill billA = new Bill();
        billA.setId("bill-1");
        billA.setRetailerId("retailer-A");
        billA.setCustomerName("Alice Wonder");
        billA.setCustomerEmail("alice@alpha.com");
        billA.setCustomerPhone("1112223333");
        billA.setCreatedAt(Instant.now());

        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(List.of(billA));
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());

        // Database query only returns customer1 whose identifier matched Retailer A's records
        when(userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any()))
                .thenReturn(List.of(customer1));

        when(warrantyRepository.countByCustomerIdAndRetailerId("cust-1", "retailer-A")).thenReturn(2L);

        // Retailer A searches
        List<CustomerLookupResponse> results = retailerService.lookupCustomers("user-retailer-A", "Alice");

        assertEquals(1, results.size());
        CustomerLookupResponse found = results.get(0);
        assertEquals("Alice Wonder", found.getName());
        assertEquals("alice@alpha.com", found.getEmail());
        assertEquals(2L, found.getTotalWarranties());
        assertEquals(1L, found.getPreviousPurchasesWithRetailer());

        // Verify Bob (customer of Retailer B) was NEVER returned
        assertTrue(results.stream().noneMatch(c -> "Bob Builder".equals(c.getName())));
    }

    @Test
    @DisplayName("Cross-tenant isolation: Retailer B customer does not appear for Retailer A")
    void testLookupCustomers_DoesNotExposeAnotherRetailersCustomer() {
        when(retailerRepository.findByUserId("user-retailer-A")).thenReturn(Optional.of(retailerA));

        // Retailer A has transactions with Customer 1 only
        Bill billA = new Bill();
        billA.setId("bill-1");
        billA.setRetailerId("retailer-A");
        billA.setCustomerName("Alice Wonder");
        billA.setCustomerEmail("alice@alpha.com");
        billA.setCreatedAt(Instant.now());

        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(List.of(billA));
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());

        // Querying for Bob: Bob was never a customer of Retailer A, so MongoDB query returns empty for Bob
        when(userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any()))
                .thenReturn(List.of(customer1));

        List<CustomerLookupResponse> results = retailerService.lookupCustomers("user-retailer-A", "Bob");

        // Bob should NOT be returned
        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("Multi-retailer customer: Customer appears for both retailers with isolated metrics")
    void testLookupCustomers_MultiRetailerCustomer_IsDataIsolated() {
        // Customer 1 purchased from Retailer A (1 bill, 1 warranty)
        when(retailerRepository.findByUserId("user-retailer-A")).thenReturn(Optional.of(retailerA));

        Bill billA = new Bill();
        billA.setId("bill-A1");
        billA.setRetailerId("retailer-A");
        billA.setCustomerName("Alice Wonder");
        billA.setCustomerEmail("alice@alpha.com");
        billA.setCreatedAt(Instant.now());

        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(List.of(billA));
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());
        when(userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any()))
                .thenReturn(List.of(customer1));
        when(warrantyRepository.countByCustomerIdAndRetailerId("cust-1", "retailer-A")).thenReturn(1L);

        List<CustomerLookupResponse> resultsA = retailerService.lookupCustomers("user-retailer-A", "alice");

        assertEquals(1, resultsA.size());
        assertEquals(1L, resultsA.get(0).getPreviousPurchasesWithRetailer());
        assertEquals(1L, resultsA.get(0).getTotalWarranties()); // Retailer A's warranty only

        // Now Customer 1 purchased from Retailer B (3 bills, 4 warranties)
        when(retailerRepository.findByUserId("user-retailer-B")).thenReturn(Optional.of(retailerB));

        Bill billB1 = new Bill();
        billB1.setId("bill-B1");
        billB1.setRetailerId("retailer-B");
        billB1.setCustomerName("Alice Wonder");
        billB1.setCustomerEmail("alice@alpha.com");
        billB1.setCreatedAt(Instant.now());

        Bill billB2 = new Bill();
        billB2.setId("bill-B2");
        billB2.setRetailerId("retailer-B");
        billB2.setCustomerName("Alice Wonder");
        billB2.setCustomerEmail("alice@alpha.com");
        billB2.setCreatedAt(Instant.now());

        Bill billB3 = new Bill();
        billB3.setId("bill-B3");
        billB3.setRetailerId("retailer-B");
        billB3.setCustomerName("Alice Wonder");
        billB3.setCustomerEmail("alice@alpha.com");
        billB3.setCreatedAt(Instant.now());

        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-B")).thenReturn(List.of(billB1, billB2, billB3));
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-B")).thenReturn(Collections.emptyList());
        when(userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any()))
                .thenReturn(List.of(customer1));
        when(warrantyRepository.countByCustomerIdAndRetailerId("cust-1", "retailer-B")).thenReturn(4L);

        List<CustomerLookupResponse> resultsB = retailerService.lookupCustomers("user-retailer-B", "alice");

        assertEquals(1, resultsB.size());
        assertEquals(3L, resultsB.get(0).getPreviousPurchasesWithRetailer());
        assertEquals(4L, resultsB.get(0).getTotalWarranties()); // Retailer B's warranty only
    }

    @Test
    @DisplayName("Retailer with zero transactions returns empty list and does not query users")
    void testLookupCustomers_NoTransactions_ReturnsEmpty() {
        when(retailerRepository.findByUserId("user-retailer-A")).thenReturn(Optional.of(retailerA));
        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());

        List<CustomerLookupResponse> results = retailerService.lookupCustomers("user-retailer-A", "anything");

        assertTrue(results.isEmpty());
        // Verify userRepository was never queried
        verify(userRepository, never()).findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any());
    }

    @Test
    @DisplayName("Unregistered in-store customer appears for the retailer who served them")
    void testLookupCustomers_UnregisteredInStoreCustomer() {
        when(retailerRepository.findByUserId("user-retailer-A")).thenReturn(Optional.of(retailerA));

        Bill billWalkin = new Bill();
        billWalkin.setId("bill-w1");
        billWalkin.setRetailerId("retailer-A");
        billWalkin.setCustomerName("Guest Shopper");
        billWalkin.setCustomerEmail("guest@walkin.com");
        billWalkin.setCustomerPhone("9988776655");
        billWalkin.setCreatedAt(Instant.now());

        when(billRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(List.of(billWalkin));
        when(purchaseRepository.findByRetailerIdOrderByCreatedAtDesc("retailer-A")).thenReturn(Collections.emptyList());
        // No registered users matched
        when(userRepository.findRegisteredCustomersByRetailerCustomerIdentifiers(any(), any(), any()))
                .thenReturn(Collections.emptyList());

        List<CustomerLookupResponse> results = retailerService.lookupCustomers("user-retailer-A", "Guest");

        assertEquals(1, results.size());
        CustomerLookupResponse walkin = results.get(0);
        assertEquals("Guest Shopper", walkin.getName());
        assertEquals("guest@walkin.com", walkin.getEmail());
        assertFalse(walkin.isRegistered());
        assertEquals("UNREGISTERED", walkin.getAccountStatus());
        assertEquals(0L, walkin.getTotalWarranties());
    }
}
