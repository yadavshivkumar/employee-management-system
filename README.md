# PeopleHub — Employee Management System

A responsive, dark-themed Employee Management System built with **HTML5, CSS3, and vanilla JavaScript**. It runs entirely in the browser and uses LocalStorage for persistence. No backend, framework, database server, or build step is required.

## Features

- Dashboard cards for total employees, active employees, departments, and monthly payroll.
- Department distribution chart and workforce status donut chart, rendered with CSS and JavaScript (no chart library).
- Employee CRUD: create, view, edit, and delete records.
- Search by name, employee ID, email, role, department, phone, or location.
- Filter by department and status; sort by name, joining date, or salary.
- Pagination and bulk selection/deletion.
- Department creation and deletion safeguards.
- CSV export of the currently filtered employee list.
- Responsive dark layout for desktop, tablet, and mobile.
- Form validation, duplicate employee ID/email checks, confirmation dialogs, toast feedback, accessible labels, and CSV formula-injection mitigation.
- Seeded sample records on first launch so the dashboard is immediately populated.
- Data persists in browser LocalStorage.

## Project files

```text
employee-management-system/
├── index.html       # Semantic page structure and dialogs
├── style.css        # Dark theme, layout, responsive styles
├── script.js        # Data, rendering, validation, CRUD, export
└── README.md        # Project documentation
```

## How to run

1. Download and extract the project folder.
2. Open the folder in Visual Studio Code or another editor.
3. Open `index.html` directly in a modern browser. Alternatively, use VS Code's Live Server extension.
4. Add, edit, search, filter, or delete employee records.
5. Refresh the page to verify that data persists.

The Google Fonts stylesheet is optional and only affects typography. The app's core functionality does not require an internet connection after the files are available.

## How data is stored

The app stores JSON arrays under these LocalStorage keys:

- `peoplehub_employees_v1`
- `peoplehub_departments_v1`

Employee records include `id`, `name`, `email`, `phone`, `department`, `role`, `salary`, `status`, `joiningDate`, and `location`.

To reset the demo data, open the browser's Developer Tools → Application/Storage → Local Storage, select the origin used to open the app, and remove the two keys above. Reload the page. It will initialize the sample data again. This reset removes any records you entered.

## Business rules and limitations

- Employee IDs and email addresses must be unique.
- Salary is a non-negative monthly amount in INR.
- Monthly payroll on the dashboard sums employees who are not marked Inactive (Active + On Leave).
- Departments with employees cannot be deleted until those employees are reassigned or removed.
- CSV export follows the current search/filter/sort criteria.
- Data is local to the browser and origin. It is not shared across different devices or users and can be cleared by the browser.
- This is a front-end academic/demo project, not a secure production HR system. LocalStorage is not encrypted, there is no authentication or authorization, and data is editable by the browser user. Do not store real sensitive employee information.



## Test checklist

- [ ] Add an employee with valid data.
- [ ] Try submitting with required fields missing.
- [ ] Try a duplicate employee ID and duplicate email.
- [ ] Edit an employee and verify dashboard values update.
- [ ] Search by name, ID, email, and role.
- [ ] Filter by department and status; change sort order.
- [ ] Navigate between pages and select visible/all rows.
- [ ] Delete one record and multiple selected records.
- [ ] Export filtered records to CSV and open the file in a spreadsheet.
- [ ] Add a department and try deleting a department that still has employees.
- [ ] Refresh the page and confirm data remains.
- [ ] Test at mobile and desktop viewport widths.
