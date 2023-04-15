import React,{ useEffect,useState } from "react";
import styles from "./answer.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

interface AnswerProps {
  text: string;
}

export const Answer: React.FC<AnswerProps> = ({ text }) => {
  const [copySuccess,setCopySuccess] = useState("");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopySuccess("Copied!");

    setTimeout(() => {
      setCopySuccess("");
    },10000);   // reset after 10 seconds
  };

  return (
    <div className={styles.answer}>
      <div className={styles.contentContainer}>
        <ReactMarkdown remarkPlugins={[gfm]}>{text}</ReactMarkdown>
      </div>
      <div className={styles.buttonContainer}>
        <button onClick={copyToClipboard} className={styles.copyButton}>
          {copySuccess ? copySuccess : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
};
