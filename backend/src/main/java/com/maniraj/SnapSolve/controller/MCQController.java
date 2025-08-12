package com.maniraj.SnapSolve.controller;

import com.maniraj.SnapSolve.model.ImageUploadForm;
import com.maniraj.SnapSolve.model.Question;
import com.maniraj.SnapSolve.model.QuestionSet;
import com.maniraj.SnapSolve.repository.QuestionSetRepository;
import com.maniraj.SnapSolve.service.DocumentService;
import com.maniraj.SnapSolve.service.GeminiService;
import com.itextpdf.text.DocumentException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;


/**
 * Controller for handling MCQ screenshot uploads and processing.
 */
@RestController
@RequestMapping("/api/mcq")
@CrossOrigin(origins = "http://localhost:5173")
public class MCQController {

    private static final Logger logger = LoggerFactory.getLogger(MCQController.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final GeminiService geminiService;
    private final QuestionSetRepository questionSetRepository;
    private final DocumentService documentService;

    @Autowired
    public MCQController(GeminiService geminiService,
                         QuestionSetRepository questionSetRepository,
                         DocumentService documentService) {
        this.geminiService = geminiService;
        this.questionSetRepository = questionSetRepository;
        this.documentService = documentService;
    }

    @GetMapping("/history")
    public List<QuestionSet> getHistory() {
        return questionSetRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/results/{id}")
    public ResponseEntity<QuestionSet> getQuestionSet(@PathVariable Long id) {
        return questionSetRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/upload")
    public ResponseEntity<?> processImage(@RequestParam("image") MultipartFile imageFile) {
        if (imageFile == null || imageFile.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select an image to upload");
        }

        try {
            logger.info("Processing uploaded image with Gemini 2.5 Flash: {}", imageFile.getOriginalFilename());
            List<Question> questions = geminiService.processImageForQuestions(imageFile);

            if (questions.isEmpty()) {
                return ResponseEntity.badRequest().body("No questions could be extracted from the image");
            }

            QuestionSet questionSet = new QuestionSet("Uploaded Image: " +
                    (imageFile.getOriginalFilename() != null ? imageFile.getOriginalFilename() : "Unnamed"));
            questions.forEach(questionSet::addQuestion);
            questionSet = questionSetRepository.save(questionSet);

            return ResponseEntity.ok(questionSet);
        } catch (IOException e) {
            logger.error("Error processing file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing file: " + e.getMessage());
        }
    }

    @PostMapping("/paste-image")
    public ResponseEntity<?> processPastedImage(@RequestBody ImageUploadForm imageUploadForm) {
        String base64Image = imageUploadForm.getBase64Image();

        if (base64Image == null || base64Image.isEmpty()) {
            return ResponseEntity.badRequest().body("No image data provided");
        }

        // Remove possible data URL prefix
        if(base64Image.startsWith("data:image")){
            base64Image = base64Image.substring(base64Image.indexOf(",") + 1);
        }

        try {
            logger.info("Processing pasted image with Gemini 2.5 Flash");
            List<Question> questions = geminiService.processBase64ImageForQuestions(base64Image);

            if (questions.isEmpty()) {
                return ResponseEntity.badRequest().body("No questions extracted from image");
            }

            QuestionSet questionSet = new QuestionSet("Pasted Image");
            questions.forEach(questionSet::addQuestion);
            questionSet = questionSetRepository.save(questionSet);

            return ResponseEntity.ok(questionSet);
        } catch (IOException e) {
            logger.error("Error processing pasted image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing pasted image: " + e.getMessage());
        }
    }

    @GetMapping("/results/{id}/pdf")
    public ResponseEntity<?> downloadPdf(@PathVariable Long id) {
        return questionSetRepository.findById(id)
                .map(questionSet -> {
                    try {
                        byte[] pdfBytes = documentService.generatePdf(questionSet);
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_PDF);
                        headers.setContentDispositionFormData("attachment", "mcq-results-" + id + ".pdf");
                        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
                    } catch (DocumentException e) {
                        logger.error("Error generating PDF", e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/results/{id}/word")
    public ResponseEntity<?> downloadWord(@PathVariable Long id) {
        return questionSetRepository.findById(id)
                .map(questionSet -> {
                    try {
                        byte[] wordBytes = documentService.generateWord(questionSet);
                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                        headers.setContentDispositionFormData("attachment", "mcq-results-" + id + ".docx");
                        return new ResponseEntity<>(wordBytes, headers, HttpStatus.OK);
                    } catch (IOException e) {
                        logger.error("Error generating Word doc", e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
