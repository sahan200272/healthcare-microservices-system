package com.healthcare.appointment_service.model;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "test")
@NoArgsConstructor
@AllArgsConstructor
public class TestModel {

    @Id
    private String id;
    private String name;

    public void setName(String name) {
        this.name = name;
    }
}