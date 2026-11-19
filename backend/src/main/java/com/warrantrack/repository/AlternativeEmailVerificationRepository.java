package com.warrantrack.repository;

import com.warrantrack.model.AlternativeEmailVerification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlternativeEmailVerificationRepository extends MongoRepository<AlternativeEmailVerification, String> {

    Optional<AlternativeEmailVerification> findByUserIdAndEmailNormalized(String userId, String emailNormalized);

    Optional<AlternativeEmailVerification> findByVerificationToken(String verificationToken);

    List<AlternativeEmailVerification> findByUserId(String userId);

    void deleteByUserIdAndEmailNormalized(String userId, String emailNormalized);
}
