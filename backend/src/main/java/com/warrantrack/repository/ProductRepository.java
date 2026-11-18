package com.warrantrack.repository;

import com.warrantrack.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {

    Page<Product> findByRetailerIdAndActiveTrue(String retailerId, Pageable pageable);

    Page<Product> findByRetailerId(String retailerId, Pageable pageable);

    long countByRetailerId(String retailerId);
}
