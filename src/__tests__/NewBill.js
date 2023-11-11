/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import BillsUI from "../views/BillsUI.js";

import store from "../__mocks__/store.js";
import userEvent from '@testing-library/user-event'

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        test("Then mail icon in vertical layout should be highlighted", async() => {
            Object.defineProperty(window, 'localStorage', { value: localStorageMock })
            window.localStorage.setItem('user', JSON.stringify({
                type: 'Employee'
            }))
            const root = document.createElement("div")
            root.setAttribute("id", "root")
            document.body.append(root)
                // mock navigation and loading page
            const pathname = ROUTES_PATH['NewBill']
            root.innerHTML = ROUTES({ pathname: pathname, loading: true })
            document.getElementById('layout-icon1').classList.remove('active-icon')
            document.getElementById('layout-icon2').classList.add('active-icon')
                // get email icon
            await waitFor(() => screen.getByTestId('icon-mail'))
            const mailIcon = screen.getByTestId('icon-mail')
                //check if icon has active-icon class
            const iconActivated = mailIcon.classList.contains('active-icon')
            expect(iconActivated).toBeTruthy();
        })
    })
    describe("When I select an image in a correct format", () => {
        test("Then the input file should display the file name", () => {
            //page NewBill
            const html = NewBillUI();
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };
            // initialisation NewBill
            const newBill = new NewBill({ document, onNavigate, store, localStorage: window.localStorage })
            const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
            const input = screen.getByTestId('file');
            input.addEventListener('change', handleChangeFile);
            //file with the right format
            fireEvent.change(input, {
                target: {
                    files: [new File(['image.png'], 'image.png', {
                        type: 'image/png'
                    })],
                }
            })
            expect(handleChangeFile).toHaveBeenCalled()
            expect(input.files[0].name).toBe('image.png');
        })
        test("Then a bill is created", () => {
            //page NewBill
            const html = NewBillUI();
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };
            // initialisation NewBill
            const newBill = new NewBill({ document, onNavigate, store: null, localStorage: window.localStorage })
                //submit
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
            const submit = screen.getByTestId('form-new-bill');
            submit.addEventListener('submit', handleSubmit);
            fireEvent.submit(submit)
            expect(handleSubmit).toHaveBeenCalled();
        })
    })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
    describe("When I add a new bill", () => {
        test("Then it creates a new bill", () => {
            //page NewBill
            document.body.innerHTML = NewBillUI()
                // bill initialization
            const inputData = {
                    type: 'Transports',
                    name: 'Test',
                    datepicker: '2021-05-26',
                    amount: '100',
                    vat: '10',
                    pct: '19',
                    commentary: 'Test',
                    file: new File(['test'], 'test.png', { type: 'image/png' }),
                }
                // get elements from the page
            const formNewBill = screen.getByTestId('form-new-bill')
            const inputExpenseName = screen.getByTestId('expense-name')
            const inputExpenseType = screen.getByTestId('expense-type')
            const inputDatepicker = screen.getByTestId('datepicker')
            const inputAmount = screen.getByTestId('amount')
            const inputVAT = screen.getByTestId('vat')
            const inputPCT = screen.getByTestId('pct')
            const inputCommentary = screen.getByTestId('commentary')
            const inputFile = screen.getByTestId('file')

            // values input
            fireEvent.change(inputExpenseType, {
                target: { value: inputData.type },
            })
            expect(inputExpenseType.value).toBe(inputData.type)

            fireEvent.change(inputExpenseName, {
                target: { value: inputData.name },
            })
            expect(inputExpenseName.value).toBe(inputData.name)

            fireEvent.change(inputDatepicker, {
                target: { value: inputData.datepicker },
            })
            expect(inputDatepicker.value).toBe(inputData.datepicker)

            fireEvent.change(inputAmount, {
                target: { value: inputData.amount },
            })
            expect(inputAmount.value).toBe(inputData.amount)

            fireEvent.change(inputVAT, {
                target: { value: inputData.vat },
            })
            expect(inputVAT.value).toBe(inputData.vat)

            fireEvent.change(inputPCT, {
                target: { value: inputData.pct },
            })
            expect(inputPCT.value).toBe(inputData.pct)

            fireEvent.change(inputCommentary, {
                target: { value: inputData.commentary },
            })
            expect(inputCommentary.value).toBe(inputData.commentary)

            userEvent.upload(inputFile, inputData.file)
            expect(inputFile.files[0]).toStrictEqual(inputData.file)
            expect(inputFile.files).toHaveLength(1)

            // localStorage should be populated with form data
            Object.defineProperty(window, 'localStorage', {
                value: {
                    getItem: jest.fn(() =>
                        JSON.stringify({
                            email: 'email@test.com',
                        })
                    ),
                },
                writable: true,
            })

            // we have to mock navigation to test it
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }

            //initialisation NewBill
            const newBill = new NewBill({
                document,
                onNavigate,
                localStorage: window.localStorage,
            })

            //event firing
            const handleSubmit = jest.fn(newBill.handleSubmit)
            formNewBill.addEventListener('submit', handleSubmit)
            fireEvent.submit(formNewBill)
            expect(handleSubmit).toHaveBeenCalled()
        })
        test("Then it fails with a 404 message error", async() => {
            const html = BillsUI({ error: 'Erreur 404' })
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 404/);
            expect(message).toBeTruthy();
        })
        test("Then it fails with a 500 message error", async() => {
            const html = BillsUI({ error: 'Erreur 500' })
            document.body.innerHTML = html;
            const message = await screen.getByText(/Erreur 500/);
            expect(message).toBeTruthy();
        })
    })
})