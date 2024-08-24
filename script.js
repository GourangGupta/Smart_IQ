class Quiz {
  constructor() {
    // Create DOM elements are select for managing the quiz display.
    this.container = document.querySelector(".container");
    this.questionBox = document.querySelector(".question");
    this.choicesBox = document.querySelector(".choices");
    this.nextBtn = document.querySelector(".nextBtn");
    this.prevBtn = document.querySelector(".prevBtn");
    this.scoreCard = document.querySelector(".scoreCard");
    this.alert = document.querySelector(".alert");
    this.timer = document.querySelector(".timer");
    this.startBtn = document.querySelector(".startBtn");
    this.categorySelect = document.getElementById("category");
    this.difficultySelect = document.getElementById("difficulty");
    this.settings = document.querySelector(".settings");

    // Initialize variables

    // Track current question in the quiz & User score & indicate itself & Selected answer.
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.quizOver = false;
    this.selectedAnswers = [];

    // Countdown timer for each question & hold interval ID
    this.timeLeft = 20;
    this.timerID = null;
    this.quiz = []; // Store fetched quiz questions.

    // Set up event listeners for buttons and actions
    this.initEventListeners();
  }

  // Fetch quiz questions from the API (openTDB).
  async fetchQuestions(category, difficulty) {
    let apiUrl = "https://opentdb.com/api.php?amount=10&type=multiple";
    apiUrl += category !== "any" ? `&category=${category}` : "";
    apiUrl += difficulty !== "any" ? `&difficulty=${difficulty}` : "";

    try {
      // Create API request to get quiz data
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Format the quiz data into a manageable format
      this.quiz = data.results.map((item) => ({
        question: item.question,
        choices: [...item.incorrect_answers, item.correct_answer].sort(
          () => Math.random() - 0.5
        ),
        answer: item.correct_answer,
      }));

      // Initialize selectedAnswers array to track user answers
      this.selectedAnswers = Array(this.quiz.length).fill(null);

      // Start the quiz
      this.startQuiz();
    } catch (error) {
      // Display an alert if there is an error fetching.
      this.displayAlert("Failed to load questions. Please try again later.");
    }
  }

  // Display the current question and choices
  showQuestion() {
    if (this.currentQuestionIndex < this.quiz.length) {
      // Fetch current question and choices
      const questionDetails = this.quiz[this.currentQuestionIndex];
      this.questionBox.innerHTML = questionDetails.question; // Display the question text
      this.choicesBox.textContent = ""; // Clear previous choices

      // Create choices dynamically
      questionDetails.choices.forEach((choice) => {
        const choiceDiv = document.createElement("div");
        choiceDiv.innerHTML = choice;
        choiceDiv.classList.add("choice"); 

        // Restore previously selected choice (if any)
        if (this.selectedAnswers[this.currentQuestionIndex] === choice) {
          choiceDiv.classList.add("selected");
        }

        // Add click event listener to handle user selection
        choiceDiv.addEventListener("click", () => this.handleChoiceClick(choiceDiv, choice, questionDetails));

        // Add choice to the choices box
        this.choicesBox.appendChild(choiceDiv);
      });

      // Start the timer for the current question
      this.startTimer();

      // Show or hide the "Previous" button based on current question index
      this.prevBtn.style.display =
        this.currentQuestionIndex > 0 ? "inline-block" : "none";

      // Update the question progress
      this.updateProgress();
    } else {
      // Quiz is over, show the score
      this.stopTimer();
      this.showScore();
    }
  }

  // Check when a user selects a choice
  handleChoiceClick(choiceDiv, choice, questionDetails) {
    // Prevent selecting again once a choice is made
    if (this.selectedAnswers[this.currentQuestionIndex]) return;

    // Clear previous selection styling
    document
      .querySelectorAll(".choice")
      .forEach((c) => c.classList.remove("selected"));

    // Mark current choice as selected
    choiceDiv.classList.add("selected");

    // Save the user's selected answer
    this.selectedAnswers[this.currentQuestionIndex] = choice;

    // Check if the answer is correct
    const isCorrect = choice === questionDetails.answer;
    this.score += isCorrect ? 1 : 0; // Update score based on correctness

    // Display feedback (Correct or Wrong answer)
    this.displayAlert(
      isCorrect
        ? "Correct Answer!"
        : `Wrong Answer! Correct: ${questionDetails.answer}`,
      isCorrect ? "correct" : "incorrect"
    );

    // Disable further selection after answer is chosen
    document
      .querySelectorAll(".choice")
      .forEach((c) => c.classList.add("disabled"));
  }

  // Display final score when quiz ends
  showScore() {
    // Clear the question and choices boxes
    this.questionBox.innerHTML = "";
    this.choicesBox.innerHTML = "";

    // Show the final score and add a retake button
    const scoreText = `You Scored ${this.score} out of ${this.quiz.length}!`;
    this.scoreCard.innerHTML = `<p class="scoreText">${scoreText}</p><button class="retakeBtn">Retake Quiz</button>`;

    // Add event listener to retake quiz button
    this.scoreCard
      .querySelector(".retakeBtn")
      .addEventListener("click", () => this.retakeQuiz());

    // Alert the user that the quiz is completed
    this.displayAlert("You have completed this quiz!");

    // Hide navigation buttons and timer
    this.prevBtn.style.display = "none";
    this.nextBtn.style.display = "none";
    this.timer.style.display = "none";
    this.quizOver = true; // Mark the quiz as over
  }

  // Helper method to display alerts (for correct/incorrect answers or messages)
  displayAlert(msg, type = "info") {
    const alertColors = {
      correct: "#4CAF50", // Green for correct answers
      incorrect: "#FF6666", // Red for incorrect answers
      info: "#ffcc00", // Yellow for informational alerts
    };

    // Set alert background color based on type
    this.alert.style.backgroundColor = alertColors[type];
    this.alert.style.display = "block";
    this.alert.textContent = msg; // Set alert message text

    // Hide alert after 3 seconds
    setTimeout(() => (this.alert.style.display = "none"), 3000);
  }

  // Start countdown timer for each question
  startTimer() {
    // Clear any previous timer
    clearInterval(this.timerID);
    this.timeLeft = 20; // Reset time for each question
    this.timer.textContent = this.timeLeft;

    // Set interval to update timer every second
    this.timerID = setInterval(() => {
      this.timeLeft--;
      this.timer.textContent = this.timeLeft; // Update timer display

      // Handle timeout when time reaches 0
      if (this.timeLeft <= 0) {
        clearInterval(this.timerID); // Stop the timer
        this.displayAlert("Time's up!"); // Alert user that time is up
        this.nextQuestion(); // Automatically go to next question
      }
    }, 1000);
  }

  // Stop the timer when needed (e.g., when quiz is over)
  stopTimer() {
    clearInterval(this.timerID);
  }

  // Navigate to the next question
  nextQuestion() {
    this.currentQuestionIndex++;
    this.showQuestion();
  }

  // Navigate to the previous question
  prevQuestion() {
    this.currentQuestionIndex--;
    this.showQuestion();
  }

  // Start the quiz (reset any previous progress)
  startQuiz() {
    this.resetQuiz(); // Reset quiz variables
    this.showQuestion(); // Show the first question
  }

  // Retake the quiz after it is completed
  retakeQuiz() {
    this.resetQuiz(); // Reset quiz variables
    this.showQuestion(); // Start the quiz again
  }

  // Reset the quiz state and UI elements
  resetQuiz() {
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.quizOver = false;
    this.selectedAnswers.fill(null); // Clear selected answers
    this.settings.style.display = "none"; // Hide quiz settings
    this.container.style.display = "block"; // Show quiz container
    this.timer.style.display = "flex"; // Show the timer
    this.prevBtn.style.display = "none"; // Hide previous button initially
    this.nextBtn.style.display = "inline-block"; // Show next button
    this.scoreCard.innerHTML = ""; // Clear score display
    this.timer.textContent = "20"; // Reset timer display
  }

  // Update the progress display (Question x out of y)
  updateProgress() {
    const progressText = document.querySelector(".progress-text");
    progressText.textContent = `Question ${
      this.currentQuestionIndex + 1
    } out of ${this.quiz.length}`;
  }

  // Set up all necessary event listeners for buttons
  initEventListeners() {
    this.startBtn.addEventListener("click", () => {
      // Fetch quiz questions with selected category and difficulty
      this.fetchQuestions(
        this.categorySelect.value,
        this.difficultySelect.value
      );
    });

    // Move to the next question
    this.nextBtn.addEventListener("click", () => this.nextQuestion());

    // Move to the previous question
    this.prevBtn.addEventListener("click", () => this.prevQuestion());
  }
}

// Initialize quiz
const quiz = new Quiz();
