package com.healthcare.appointment_service.controller;

import com.healthcare.appointment_service.model.TestModel;
import com.healthcare.appointment_service.repository.TestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private TestRepository repo;

    @GetMapping("/save")
    public String save() {
        TestModel t = new TestModel();
        t.setName("Hello Mongo");
        repo.save(t);
        return "Saved!";
    }
}
