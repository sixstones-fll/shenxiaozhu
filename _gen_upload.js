const fs = require("fs");
const DATA_TYPES = [
  { value: "regulations", label: "\u89c4\u8303\u5e93", desc: "\u4e0a\u4f20\u5efa\u7b51\u89c4\u8303\u6570\u636e" },
  { value: "issues", label: "\u5386\u53f2\u95ee\u9898\u5e93", desc: "\u4e0a\u4f20\u5386\u53f2\u5ba1\u56fe\u95ee\u9898\u6570\u636e" },
];
const FORMAT_OPTIONS = [
  { value: "\u6587\u6863\u683c\u5f0f", label: "\u6587\u6863\u683c\u5f0f", desc: "PDF\u3001Word \u7b49\u6587\u6863" },
  { value: "\u7ed3\u6784\u5316\u683c\u5f0f", label: "\u7ed3\u6784\u5316\u683c\u5f0f", desc: "Excel\u3001CSV \u7b49\u8868\u683c" },
];
const SEGMENT_MODES = [
  { value: "auto", label: "\u81ea\u52a8\u5206\u6bb5", desc: "\u7cfb\u7edf\u81ea\u52a8\u8bc6\u522b\u6587\u6863\u7ed3\u6784\u8fdb\u884c\u5206\u6bb5" },
  { value: "custom", label: "\u81ea\u5b9a\u4e49\u5206\u6bb5", desc: "\u624b\u52a8\u8bbe\u7f6e\u5206\u6bb5\u6807\u8bc6\u7b26\u548c\u957f\u5ea6" },
  { value: "heading", label: "\u6309\u7b49\u7ea7\u5206\u6bb5", desc: "\u57fa\u4e8e\u6587\u6863\u6807\u9898\u5c42\u7ea7\u8fdb\u884c\u5206\u6bb5" },
];
const HEADING_LEVELS = [
  { value: "h1", label: "\u4e00\u7ea7\u6807\u9898" },
  { value: "h2", label: "\u4e8c\u7ea7\u6807\u9898" },
  { value: "h3", label: "\u4e09\u7ea7\u6807\u9898" },
  { value: "h4", label: "\u56db\u7ea7\u6807\u9898" },
];
const COLUMN_MAP = {
  regulations: [
    { field: "code_number", label: "\u89c4\u8303\u7f16\u53f7" },
    { field: "code_name", label: "\u89c4\u8303\u540d\u79f0" },
    { field: "article_number", label: "\u6761\u6587\u5e8f\u53f7" },
    { field: "article_content", label: "\u6761\u6587\u5185\u5bb9" },
    { field: "category", label: "\u5206\u7c7b" },
  ],
  issues: [
    { field: "issue_description", label: "\u95ee\u9898\u63cf\u8ff0" },
    { field: "major", label: "\u4e13\u4e1a\u7c7b\u522b" },
    { field: "project_name", label: "\u9879\u76ee\u540d\u79f0" },
    { field: "building_type", label: "\u5efa\u7b51\u7c7b\u578b" },
    { field: "designer", label: "\u8bbe\u8ba1\u4eba" },
    { field: "reviewer", label: "\u56fe\u5ba1\u4eba" },
  ],
};
