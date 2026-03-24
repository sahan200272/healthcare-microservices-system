//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/controller/AppointmentController

package com.healthcare.appointment_service.controller;

import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService service;

    @PostMapping
    public Appointment book(@RequestBody Appointment appointment) {
        return service.bookAppointment(appointment);
    }

    @GetMapping
    public List<Appointment> getAll(){
        return service.getAllAppointments();
    }

    @PutMapping("/cancel/{id}")
    public String cancel(@PathVariable String id) {
        service.cancelAppointment(id);
        return "Appointment cancelled";
    }
}
