package com.healthcare.appointment_service.repository;

import com.healthcare.appointment_service.model.TestModel;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TestRepository extends MongoRepository<TestModel, String> {
}
