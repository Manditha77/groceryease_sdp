package com.uok.groceryease_backend.DAO;

import com.uok.groceryease_backend.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

}
