document.addEventListener("DOMContentLoaded", () => {
  const dropdowns = document.querySelectorAll(".dropdown-container");
  const inputLanguageDropdown = document.querySelector("#input-language");
  const outputLanguageDropdown = document.querySelector("#output-language");
  const swapBtn = document.querySelector(".swap-position");
  const inputLanguage = inputLanguageDropdown.querySelector(".selected");
  const outputLanguage = outputLanguageDropdown.querySelector(".selected");
  const inputTextElem = document.querySelector("#input-text");
  const outputTextElem = document.querySelector("#output-text");
  const uploadDocument = document.querySelector("#upload-document");
  const uploadTitle = document.querySelector("#upload-title");
  const downloadBtn = document.querySelector("#download-btn");
  const darkModeCheckbox = document.getElementById("dark-mode-btn");
  const inputChars = document.querySelector("#input-chars");

  inputTextElem.focus();

  function populateDropdown(dropdown, options) {
    dropdown.querySelector("ul").innerHTML = "";
    options.forEach((option) => {
      const li = document.createElement("li");
      const title = `${option.name} (${option.native})`;
      li.innerHTML = title;
      li.dataset.value = option.code;
      li.classList.add("option");
      dropdown.querySelector("ul").appendChild(li);
    });
  }

  populateDropdown(inputLanguageDropdown, languages);
  populateDropdown(outputLanguageDropdown, languages);

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("click", (e) => {
      dropdown.classList.toggle("active");
    });

    dropdown.querySelectorAll(".option").forEach((item) => {
      item.addEventListener("click", (e) => {
        dropdown.querySelectorAll(".option").forEach((item) => {
          item.classList.remove("active");
        });
        item.classList.add("active");
        const selected = dropdown.querySelector(".selected");
        selected.innerHTML = item.innerHTML;
        selected.dataset.value = item.dataset.value;
        translate();
      });
    });
  });

  document.addEventListener("click", (e) => {
    dropdowns.forEach((dropdown) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  });

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  function translate() {
    const inputText = inputTextElem.value;
    if (!inputText.trim()) {
      outputTextElem.value = "";
      return;
    }

    const inputLanguage = inputLanguageDropdown.querySelector(".selected").dataset.value;
    const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;

    if (inputLanguage === outputLanguage && inputLanguage !== "auto") {
      outputTextElem.value = inputText;
      return;
    }

    outputTextElem.value = "Translating...";

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${inputLanguage}&tl=${outputLanguage}&dt=t&q=${encodeURI(inputText)}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        if (json && json[0]) {
          outputTextElem.value = json[0].map((item) => item[0]).join("");
        } else {
          outputTextElem.value = "Translation error: Unexpected API response";
        }
      })
      .catch((error) => {
        console.log(error);
        outputTextElem.value = "Translation failed. Please try again later.";
      });
  }

  swapBtn.addEventListener("click", (e) => {
    if (inputLanguage.dataset.value === "auto") {
      swapBtn.classList.add("swap-disabled");
      setTimeout(() => {
        swapBtn.classList.remove("swap-disabled");
      }, 500);
      return;
    }

    swapBtn.classList.add("swap-animation");
    setTimeout(() => {
      swapBtn.classList.remove("swap-animation");
    }, 300);

    const temp = inputLanguage.innerHTML;
    inputLanguage.innerHTML = outputLanguage.innerHTML;
    outputLanguage.innerHTML = temp;

    const tempValue = inputLanguage.dataset.value;
    inputLanguage.dataset.value = outputLanguage.dataset.value;
    outputLanguage.dataset.value = tempValue;

    const tempInputText = inputTextElem.value;
    inputTextElem.value = outputTextElem.value;
    outputTextElem.value = tempInputText;

    inputChars.innerHTML = inputTextElem.value.length;

    translate();
  });

  inputTextElem.addEventListener("input", debounce((e) => {
    inputChars.innerHTML = inputTextElem.value.length;

    if (inputTextElem.value.length > 5000) {
      inputTextElem.value = inputTextElem.value.slice(0, 5000);
      inputChars.innerHTML = inputTextElem.value.length;
    }

    if (inputTextElem.value.trim().length > 0) {
      translate();
    } else {
      outputTextElem.value = "";
    }
  }, 500)); 

  uploadDocument.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadTitle.innerHTML = file.name;

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (e) => {
        const content = e.target.result;
        inputTextElem.value = content.length > 5000 ? content.slice(0, 5000) : content;
        inputChars.innerHTML = inputTextElem.value.length;
        translate();
      };
    } else if (file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      alert("Note: Only text content can be extracted from these file types. For best results, use plain text files.");

      inputTextElem.value = "File format requires additional processing.\nPlease copy and paste the text directly for best results.";
      inputChars.innerHTML = inputTextElem.value.length;
    } else {
      alert("Please upload a valid file (TXT, PDF, DOC, or DOCX)");
      uploadTitle.innerHTML = "Upload a Document";
    }
  });

  downloadBtn.addEventListener("click", (e) => {
    const outputText = outputTextElem.value;
    if (!outputText.trim()) {
      alert("There is no translated text to download");
      return;
    }

    const outputLanguage = outputLanguageDropdown.querySelector(".selected").dataset.value;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `translated-to-${outputLanguage}-${timestamp}.txt`;

    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 100);
  });

  darkModeCheckbox.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", darkModeCheckbox.checked);
  });

  const defaultInputOption = inputLanguageDropdown.querySelector('[data-value="auto"]');
  if (defaultInputOption) {
    const inputSelected = inputLanguageDropdown.querySelector(".selected");
    inputSelected.innerHTML = defaultInputOption.innerHTML;
    inputSelected.dataset.value = defaultInputOption.dataset.value;
    defaultInputOption.classList.add("active");
  }

  const defaultOutputOption = outputLanguageDropdown.querySelector('[data-value="en"]');
  if (defaultOutputOption) {
    const outputSelected = outputLanguageDropdown.querySelector(".selected");
    outputSelected.innerHTML = defaultOutputOption.innerHTML;
    outputSelected.dataset.value = defaultOutputOption.dataset.value;
    defaultOutputOption.classList.add("active");
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+Enter to translate
    if (e.ctrlKey && e.key === "Enter") {
      translate();
    }

    // Ctrl+S to download
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      downloadBtn.click();
    }

    // Ctrl+Shift+S to swap languages
    if (e.ctrlKey && e.shiftKey && e.key === "S") {
      e.preventDefault();
      swapBtn.click();
    }
  });

  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    darkModeCheckbox.checked = true;
    document.body.classList.add("dark");
  }
 
const micBtn = document.getElementById("mic-btn");
let recognizing = false;
let recognition;

if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.continuous = false;

  function updateRecognitionLanguage() {
    const selectedLang = inputLanguageDropdown
      .querySelector(".selected")
      .dataset.value || "en";
    recognition.lang = selectedLang;
  }

  recognition.onstart = () => {
    recognizing = true;
    micBtn.style.backgroundColor = "#e74c3c"; 
    micBtn.title = "Listening...";
  };

  recognition.onend = () => {
    recognizing = false;
    micBtn.style.backgroundColor = "var(--primary-color)";
    micBtn.title = "Click to speak";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputTextElem.value = transcript;
    inputChars.innerHTML = transcript.length;
    translate();
  };

  micBtn.addEventListener("click", () => {
    updateRecognitionLanguage();
    if (recognizing) {
      recognition.stop();
      recognizing = false;
    } else {
      recognition.start();
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Speech Recognition not supported in this browser";
}

});
