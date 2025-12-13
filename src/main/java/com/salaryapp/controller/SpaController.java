package com.salaryapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({"/login", "/register", "/add", "/employees", "/masters", "/masters/add", "/masters/edit/**", "/payslip"})
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}

