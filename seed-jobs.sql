-- Bulk insert for internship-tracker
-- User: 21ce7890-bbb9-44e8-ab02-c4787a541867
-- Applied To: 23 rows | Potential Jobs: 11 rows

INSERT INTO jobs (
  user_id, company, title, location, added, applied_date, status,
  job_link, app_link, cover_letter, industry, pay, notes
) VALUES
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Salient Motion', 'N/A', 'Torrance,CA', '2026-02-10', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Merck', 'N/A', 'San Francisco, CA', CURRENT_DATE, NULL, 'applied', NULL, NULL, NULL, 'Pharmaceutical Manufacturing', NULL, '2026 Future Talent program Pharmaceutical Sciences adn Clinincal Supplies (Intern)'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Boeing', 'N/A', NULL, CURRENT_DATE, NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Castelion', 'Multiple', 'Torrance,CA', '2025-12-18', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Arup (NY)', 'N/A', NULL, '2026-01-29', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, 'Due jan 31st!'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Harbinger', 'Electrical Engineering Intern', 'Garden Grove, CA', '2026-02-01', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Harbinger', 'HV Electrical Engineering Intern', 'Garden Grove, CA', '2026-02-01', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Harbinger', 'Battery Test Intern', 'Garden Grove, CA', '2026-02-01', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Red Cell', 'N/A', NULL, '2026-02-01', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, 'C++ or Python would be nice'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'vital lyfe', 'N/A', NULL, '2026-03-02', '2026-03-02', 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'NASA JPL', 'N/A', NULL, '2026-03-09', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, 'Due march 13!!'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Silvus Technologies', 'R&D/Test Engineer Intern', 'Los Angeles, CA', '2026-01-06', NULL, 'applied', NULL, NULL, NULL, NULL, '$27–$32/hr', NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Huntsman Corporation', 'Chemical Engineer Intern', 'Los Angeles', CURRENT_DATE, NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Proctor and Gamble', 'Engineering Intern', 'Oxnard, CA', CURRENT_DATE, NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Impulse Space', 'N/A', NULL, '2025-12-15', '2025-12-16', 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Arc Boat company', 'Electrical Hardware engineering intern', 'Torrance, CA', '2025-12-15', '2025-12-21', 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Arc Boat company', 'Manufacturing Engineering Intern', 'Torrance, CA', '2025-12-21', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Claros', 'N/A', NULL, '2025-12-15', '2025-12-15', 'applied', NULL, NULL, NULL, NULL, NULL, 'Need Cover letter'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'VitalLyfe', 'Electrical Engineering Intern', 'Los Angeles, CA', '2025-12-15', '2025-12-15', 'applied', NULL, NULL, NULL, NULL, NULL, 'Open positions'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Nokia', 'N/A', NULL, '2026-01-25', '2026-01-26', 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'FreeForm', 'N/A', 'Hawthorne, CA', '2026-02-10', NULL, 'applied', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'HP IQ', 'Hardware Engineering, Radio Frequency Intern', 'San Francisco, CA', CURRENT_DATE, '2026-01-07', 'applied', NULL, NULL, NULL, NULL, '$45-$48', 'Milton sent this! wait once ur in sargent lab'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Arc Boat company', 'Electrical Systems Engineering intern', 'Torrance, CA', CURRENT_DATE, '2025-12-21', 'applied', NULL, NULL, NULL, NULL, NULL, 'Don''t have MATLAB experience'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Radiant', 'Electrical Engineering Intern', 'El Segundo, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'CX2', 'Electrical Engineering Intern', 'El Segundo, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Oski', 'Electrical Engineering Intern', 'Torrance, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, 'Harrison Chen is NW Alum'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Synaptics', 'ATE Hardware Engineer', 'Irvine, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'AEI (Afflicated Engineers)', 'N/A', 'Pasadena, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, '$24/hr', '2.5+GPA'),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Panasonic Avionics', 'Hardware Engineer Intern', 'Irvine, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'P2S', 'Electrical Engineering Intern', 'Irvine or Long Beach, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Eaton', 'Electrical Engineering Intern', 'Torrance, CA', '2026-03-21', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Rivian', 'Electromechanical Design Intern', 'Irvine, CA', '2026-02-24', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Infineon', 'Electrical Engineer Intern', 'El Segundo, CA', '2026-02-24', NULL, 'not_started', NULL, NULL, NULL, NULL, NULL, NULL),
('21ce7890-bbb9-44e8-ab02-c4787a541867', 'Marathon Petroleum', 'Electrical Engineering Intern', 'Wilmington, CA (near Long beach)', CURRENT_DATE, NULL, 'not_started', NULL, NULL, NULL, NULL, '$32.31- $40.89 /hr', NULL)
;