package com.warrantrack.repository;

import com.warrantrack.model.User;
import com.warrantrack.model.enums.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailNormalized(String emailNormalized);

    @Query("{ 'secondaryEmails.emailNormalized': ?0 }")
    Optional<User> findBySecondaryEmailsEmailNormalized(String emailNormalized);

    @Query(value = "{ 'secondaryEmails.emailNormalized': ?0 }", exists = true)
    boolean existsBySecondaryEmailsEmailNormalized(String emailNormalized);

    Optional<User> findByResetToken(String resetToken);

    boolean existsByEmailNormalized(String emailNormalized);

    List<User> findByRole(Role role);
}
