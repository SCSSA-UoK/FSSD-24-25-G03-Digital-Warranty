package com.warrantrack.repository;

import com.warrantrack.model.User;
import com.warrantrack.model.enums.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailNormalized(String emailNormalized);

    Optional<User> findByResetToken(String resetToken);

    boolean existsByEmailNormalized(String emailNormalized);

    List<User> findByRole(Role role);
}
