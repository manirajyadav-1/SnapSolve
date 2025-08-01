package com.maniraj.SnapSolve.model;

import jakarta.persistence.*;
import java.util.List;


@Entity
@Table(name = "questions")
public class Question {

    public enum QuestionType {
        MCQ,
        GENERAL
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "question_text", length = 1000)
    private String questionText;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType = QuestionType.MCQ;
    
    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    private List<String> options;

    @Column(name = "answer", length = 65535)
    private String answer;
    
    @Column(name = "explanation", length = 2000)
    private String explanation;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_set_id")
    private QuestionSet questionSet;

    public Question() {
    }

    public Question(String questionText, List<String> options) {
        this.questionText = questionText;
        this.options = options;
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
    
    public QuestionType getQuestionType() {
        return questionType;
    }
    
    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }
    
    public QuestionSet getQuestionSet() {
        return questionSet;
    }
    
    public void setQuestionSet(QuestionSet questionSet) {
        this.questionSet = questionSet;
    }

    @Override
    public String toString() {
        return "Question{" +
                "id=" + id +
                ", questionText='" + questionText + '\'' +
                ", options=" + options +
                ", answer='" + answer + '\'' +
                ", explanation='" + explanation + '\'' +
                '}';
    }
}