//healthcare-microservices-system/healthcare/services/appointment-service/src/main/java/com.healthcare.appointment_service/service/AppointmentService

package com.healthcare.appointment_service.service;

import com.healthcare.appointment_service.model.Appointment;
import com.healthcare.appointment_service.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository repository;

    public Appointment bookAppointment(Appointment appointment) {
        appointment.setStatus("Booked");
        return repository.save(appointment);
    }

    public List<Appointment> getAllAppointments(){
        return repository.findAll();
    }

    public void cancelAppointment(String id){
        Appointment appt = repository.findById(id).orElseThrow();
        appt.setStatus("Cancelled");
        repository.save(appt);
    }
}
