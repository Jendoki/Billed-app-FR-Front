/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // view
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // container
  describe("When i click on the NewBill button", () => {
    test("Then the handleClickNewBill function should be called", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = BillsUI({
        data: bills
      })
  
      const newBillBtn = screen.getByTestId('btn-new-bill')
      const handleClickNewBill1 = jest.fn(() => newBills.handleClickNewBill())
      newBillBtn.addEventListener('click', handleClickNewBill1)
      userEvent.click(newBillBtn)
      expect(handleClickNewBill1).toHaveBeenCalled()
    })
  })

  describe("When I click on the eye icon", () => {
    beforeAll(()=> {
      jQuery.fn.modal = jest.fn()
    })

    test("Then the function handleClickIconEye should be called", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage
      });

      document.body.innerHTML = BillsUI({
        data: bills
      })

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye1 = jest.fn(() =>
        newBills.handleClickIconEye(eyeIcon)
      );
      eyeIcon.addEventListener("click", handleClickIconEye1);
      userEvent.click(eyeIcon);
      expect(handleClickIconEye1).toHaveBeenCalled();
    });

    test("Then it should open the Modal", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname
        })
      }
      const newBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage
      });

      document.body.innerHTML = BillsUI({
        data: bills
      })

      const eyeIcon = screen.getAllByTestId("icon-eye")
      const handleClickIconEye1 = jest.fn((icon) => newBills.handleClickIconEye(icon)).
      mockImplementation((icon) => {
        const billUrl = 'https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a'
        const imgWidth = 755
        return `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      })

      eyeIcon.forEach(icon => {
        icon.addEventListener('click', (icon) => handleClickIconEye1(icon))
      })

      userEvent.click(eyeIcon[0])

      expect(screen.getAllByText("Justificatif")).toBeTruthy();
    })
  });

  describe('When I am on Bills page but it is loading', () => {
		test('Then I should land on a loading page', () => {
			const html = BillsUI({ data: [], loading: true });
			document.body.innerHTML = html;
			expect(screen.getAllByText('Loading...')).toBeTruthy();
		});
	});

  describe('When I am on Bills page but back-end send an error message', () => {
		test('Then I should land on an error page', () => {
			const html = BillsUI({ data: [], loading: false, error: 'Whoops!' });
			document.body.innerHTML = html;
			expect(screen.getAllByText('Erreur')).toBeTruthy();
		});
  })

  
  describe("When I navigate to Bills page", () => {
    test("fetch bills from mock API GET", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      const pathname = ROUTES_PATH['Bills']
      root.innerHTML = ROUTES({ pathname: pathname, loading: true })
      const bills = new Bills({ document, onNavigate, store: mockStore, localStorage })
      bills.getBills().then(data => {
        root.innerHTML = BillsUI({ data })
        expect(document.querySelector('tbody').rows.length).toBeGreaterThan(0)
      })
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
       'localStorage', { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
    })
    test("fetches bills from an API and fails with 404 message error", async() => {
      const html = BillsUI({ error: 'Erreur 404' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test("fetches messages from an API and fails with 500 message error", async() => {
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })
})
