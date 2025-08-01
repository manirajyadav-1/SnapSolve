package com.maniraj.SnapSolve.repository;

import com.maniraj.SnapSolve.model.QuestionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuestionSetRepository extends JpaRepository<QuestionSet, Long> {
    List<QuestionSet> findAllByOrderByCreatedAtDesc();
}
