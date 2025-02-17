package com.uok.groceryease_backend.service;

import com.uok.groceryease_backend.DTO.UserRegistrationDTO;
import com.uok.groceryease_backend.entity.User;
import com.uok.groceryease_backend.entity.UserAuth;
import com.uok.groceryease_backend.repository.UserAuthRepository;
import com.uok.groceryease_backend.repository.UserRepository;
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

    public UserRegistrationDTO loginUser(String username, String password) {
        UserAuth userAuth = userAuthRepository.findByUsername(username);
        if (userAuth != null && userAuth.getPassword().equals(password)) {
            User user = userAuth.getUser();
            return convertToDTO(user, userAuth);
        }
        return null; // or throw an exception
    }

    public UserRegistrationDTO registerUser(UserRegistrationDTO userDTO) {
        User user = new User();
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

        return convertToDTO(savedUser, userAuth);
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

    public UserRegistrationDTO updateUser(Long userId, UserRegistrationDTO userDTO) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            user.setFirstName(userDTO.getFirstName());
            user.setLastName(userDTO.getLastName());
            user.setEmail(userDTO.getEmail());
            user.setPhoneNo(userDTO.getPhoneNo());
            user.setUserType(userDTO.getUserType());

            User updatedUser = userRepository.save(user);

            UserAuth userAuth = userAuthRepository.findByUser(updatedUser);
            userAuth.setUsername(userDTO.getUsername());
            userAuth.setPassword(userDTO.getPassword());

            userAuthRepository.save(userAuth);

            return convertToDTO(updatedUser, userAuth);
        }
        return null; // or throw an exception
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
        userDTO.setUsername(userAuth.getUsername());
        userDTO.setPassword(userAuth.getPassword());
        return userDTO;
    }
}