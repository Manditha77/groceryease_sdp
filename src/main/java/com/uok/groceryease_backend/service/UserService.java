package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.entity.Customer;
import com.uok.groceryease_backend.entity.Employee;
import com.uok.groceryease_backend.entity.Owner;
import com.uok.groceryease_backend.entity.User;
import com.uok.groceryease_backend.entity.UserAuth;
import com.uok.groceryease_backend.entity.UserType;
import com.uok.groceryease_backend.DAO.UserAuthRepository;
import com.uok.groceryease_backend.DAO.UserRepository;
import com.uok.groceryease_backend.DAO.CustomerRepository;
import com.uok.groceryease_backend.DAO.EmployeeRepository;
import com.uok.groceryease_backend.DAO.OwnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserAuthRepository userAuthRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private OwnerRepository ownerRepository;

    public UserRegistrationDTO loginUser(String username, String password) {
        UserAuth userAuth = userAuthRepository.findByUsername(username);
        if (userAuth != null && userAuth.getPassword().equals(password)) {
            return convertToDTO(userAuth.getUser(), userAuth);
        }
        return null;
    }

    @Transactional
    public UserRegistrationDTO registerUser(UserRegistrationDTO userDTO) {
        User user;
        if (UserType.CUSTOMER.equals(userDTO.getUserType())) {
            Customer customer = new Customer();
            customer.setAddress(userDTO.getAddress());
            customer.setCustomerType(userDTO.getCustomerType() != null ? userDTO.getCustomerType() : "ONLINE");
            user = customer;
        } else if (UserType.EMPLOYEE.equals(userDTO.getUserType())) {
            Employee employee = new Employee();
            employee.setAddress(userDTO.getAddress());
            user = employee;
        } else if (UserType.OWNER.equals(userDTO.getUserType())) {
            Owner owner = new Owner();
            user = owner;
        } else {
            user = new User();
        }
        user.setFirstName(userDTO.getFirstName());
        user.setLastName(userDTO.getLastName());
        user.setEmail(userDTO.getEmail());
        user.setPhoneNo(userDTO.getPhoneNo());
        user.setUserType(userDTO.getUserType());

        User savedUser = userRepository.save(user);

        UserAuth userAuth = new UserAuth();
        userAuth.setUser(savedUser);
        userAuth.setUsername(userDTO.getUsername());
        userAuth.setPassword(userDTO.getPassword());

        userAuthRepository.save(userAuth);

        if (user instanceof Customer) {
            customerRepository.save((Customer) user);
        } else if (user instanceof Employee) {
            employeeRepository.save((Employee) user);
        } else if (user instanceof Owner) {
            ownerRepository.save((Owner) user);
        }

        return convertToDTO(savedUser, userAuth);
    }

    @Transactional
    public User registerCreditCustomer(UserRegistrationDTO userDTO) {
        // Check if a customer already exists with the given phone number
        Optional<User> existingUser = userRepository.findAll().stream()
                .filter(user -> user.getPhoneNo() != null && user.getPhoneNo().equals(userDTO.getPhoneNo()))
                .findFirst();

        if (existingUser.isPresent()) {
            return existingUser.get();
        }

        // Create a new credit customer
        Customer customer = new Customer();
        customer.setFirstName(userDTO.getFirstName());
        customer.setLastName(userDTO.getLastName());
        customer.setEmail(userDTO.getEmail() != null ? userDTO.getEmail() : ""); // Email can be empty
        customer.setPhoneNo(userDTO.getPhoneNo());
        customer.setUserType(UserType.CUSTOMER);
        customer.setAddress(userDTO.getAddress());
        customer.setCustomerType("CREDIT");

        User savedUser = userRepository.save(customer);
        customerRepository.save(customer);
        return savedUser;
    }

    public List<UserRegistrationDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(user -> {
                    UserAuth userAuth = userAuthRepository.findByUser(user);
                    return convertToDTO(user, userAuth);
                })
                .collect(Collectors.toList());
    }

    public List<UserRegistrationDTO> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();
        return customers.stream()
                .map(customer -> {
                    UserAuth userAuth = userAuthRepository.findByUser(customer);
                    return convertToDTO(customer, userAuth);
                })
                .collect(Collectors.toList());
    }

    public List<UserRegistrationDTO> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        return employees.stream()
                .map(employee -> {
                    UserAuth userAuth = userAuthRepository.findByUser(employee);
                    return convertToDTO(employee, userAuth);
                })
                .collect(Collectors.toList());
    }

    public List<UserRegistrationDTO> getAllOwners() {
        List<Owner> owners = ownerRepository.findAll();
        return owners.stream()
                .map(owner -> {
                    UserAuth userAuth = userAuthRepository.findByUser(owner);
                    return convertToDTO(owner, userAuth);
                })
                .collect(Collectors.toList());
    }

    public UserRegistrationDTO getUserByUsername(String username) {
        UserAuth userAuth = userAuthRepository.findByUsername(username);
        if (userAuth != null) {
            User user = userAuth.getUser();
            return convertToDTO(user, userAuth);
        }
        return null;
    }

    public UserRegistrationDTO updateUser(Long userId, UserRegistrationDTO userDTO) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setFirstName(userDTO.getFirstName());
            user.setLastName(userDTO.getLastName());
            user.setEmail(userDTO.getEmail());
            user.setPhoneNo(userDTO.getPhoneNo());
            user.setUserType(userDTO.getUserType());

            if (user instanceof Customer) {
                Customer customer = (Customer) user;
                customer.setAddress(userDTO.getAddress());
            } else if (user instanceof Employee) {
                Employee employee = (Employee) user;
                employee.setAddress(userDTO.getAddress());
            } else if (user instanceof Owner) {
                Owner owner = (Owner) user;
            }

            User updatedUser = userRepository.save(user);

            UserAuth userAuth = userAuthRepository.findByUser(updatedUser);
            userAuth.setUsername(userDTO.getUsername());
            userAuth.setPassword(userDTO.getPassword());

            userAuthRepository.save(userAuth);

            return convertToDTO(updatedUser, userAuth);
        }
        return null;
    }

    @Transactional
    public void deleteUser(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            userAuthRepository.deleteByUser(user);
            userRepository.delete(user);
        }
    }

    private UserRegistrationDTO convertToDTO(User user, UserAuth userAuth) {
        UserRegistrationDTO userDTO = new UserRegistrationDTO();
        userDTO.setUserId(user.getUserId());
        userDTO.setFirstName(user.getFirstName());
        userDTO.setLastName(user.getLastName());
        userDTO.setEmail(user.getEmail());
        userDTO.setPhoneNo(user.getPhoneNo());
        userDTO.setUserType(user.getUserType());
        if (userAuth != null) {
            userDTO.setUsername(userAuth.getUsername());
            userDTO.setPassword(userAuth.getPassword());
        }

        if (user instanceof Customer) {
            Customer customer = (Customer) user;
            userDTO.setAddress(customer.getAddress());
            userDTO.setCustomerType(customer.getCustomerType());
        } else if (user instanceof Employee) {
            Employee employee = (Employee) user;
            userDTO.setAddress(employee.getAddress());
        } else if (user instanceof Owner) {
            Owner owner = (Owner) user;
        }

        return userDTO;
    }
}