"use client";
import React, { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import questionsData from "@/data/questions";
import { useRouter } from "next/navigation";
import axios from "axios";
import { showToast } from "@/helpers/toastModifier/modifyToast";
import { FaSpinner } from "react-icons/fa";
import ShiftingCountdown from "@/components/Timer";

const Page = () => {
  const [selectedOptions, setSelectedOptions] = useState<any>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await axios.get("/api/getuser");
        console.log(response);
        setUserName(response.data.data);
      } catch (error) {
        showToast("Failed to fetch user", "error");
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserName();
  }, []);

  // Initialize state with data from local storage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOptions = localStorage.getItem("selectedOptions");
      if (savedOptions && !(savedOptions == "null")) {
        // console.log(typeof savedOptions)
        try {
          const parsedOptions = JSON.parse(savedOptions);
          const processedOptions: any = Object.fromEntries(
            Object.entries(parsedOptions).map(([key, value]) => {
              const numericKey = Number(key);
              if (isNaN(numericKey)) return [numericKey, null];
              if (value === "null") return [numericKey, null];
              if (value === "NaN") return [numericKey, "NaN"];
              if (value === "undefined") return [numericKey, "undefined"];
              return [numericKey, value];
            })
          );

          setSelectedOptions(processedOptions);
        } catch (e) {
          console.error("Error parsing localStorage data:", e);
        }
      }
    }
  }, []);

  // Save selected options to local storage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "selectedOptions",
          JSON.stringify(selectedOptions)
        );
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
  }, [selectedOptions]);

  const handleOptionChange = (questionId: number, optionText: string) => {
    setSelectedOptions((prevSelectedOptions: any) => ({
      ...prevSelectedOptions,
      [questionId]: optionText,
    }));
  };

  const handleSubmit = async () => {
    let calculatedScore = 0;

    questionsData.forEach((question: any) => {
      const selectedAnswer = selectedOptions?.[question.id];
      const correctAnswer = question.options.find(
        (option: any) => option.isCorrect
      )?.text;

      if (selectedAnswer === correctAnswer) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setSubmitted(true);

    // Clear local storage after form submission if needed
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedOptions");
    }

    try {
      // Redirect to the results page with query parameters
      await axios.post("/api/score", { score: calculatedScore });
      setTimeout(() => {
        router.push(
          `/results?selectedOptions=${encodeURIComponent(
            JSON.stringify(selectedOptions)
          )}&score=${calculatedScore}`
        );
      }, 0);
      await axios.get("/api/logout");
    } catch (error) {
      showToast("Error submitting score", "error");
      console.error("Error submitting score:", error);
    }
  };
  const handleTimerEnd = () => {
    console.log("Timer has ended. Perform actions here.");
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-black-100 md:px-8 px-4">
      <ShiftingCountdown onEnd={handleTimerEnd} />
      {loading ? (
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-6xl mb-4" />
          <h1 className="text-xl font-semibold">Loading...</h1>
        </div>
      ) : (
        <p className="text-purple text-center text-3xl pt-14">
          welcome <span className="font-semibold">{userName}</span>
        </p>
      )}

      <div className="pt-10">
        {questionsData.map((question: any) => (
          <div key={question.id} className="mb-8">
            <h2 className="pb-2 text-white">{`Q${question.id}. ${question.text}`}</h2>
            <SyntaxHighlighter language="javascript" style={dracula}>
              {question.code}
            </SyntaxHighlighter>
            <div className="mt-4">
              {question.options.map((option: any) => (
                <div key={option.id} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`option-${question.id}-${option.id}`}
                    name={`question-${question.id}`}
                    value={option.text}
                    checked={selectedOptions?.[question.id] === option.text}
                    onChange={() =>
                      handleOptionChange(question.id, option.text)
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor={`option-${question.id}-${option.id}`}
                    className="text-white"
                  >
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={handleSubmit}
          className="mt-8 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
};

export default Page;
