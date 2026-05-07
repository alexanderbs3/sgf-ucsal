package br.leetjourney.sgf_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SgfBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(SgfBackendApplication.class, args);
    }
}
