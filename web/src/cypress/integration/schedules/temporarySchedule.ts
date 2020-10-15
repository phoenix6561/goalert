import { Chance } from 'chance'
import { testScreen } from '../../support'
import { Schedule, User } from '../../../schema'
import { DateTime, Interval } from 'luxon'
import { round } from 'lodash-es'

const c = new Chance()
const dtfmt = "yyyy-MM-dd'T'HH:mm"

function makeIntervalDates(): [string, string, number] {
  const now = DateTime.local()
  // year is either between now and 3 years in the future
  const year = c.integer({
    min: now.year,
    max: now.year + c.integer({ min: 1, max: 3 }),
  })
  // random month, keep in the future if using current year
  const month = c.integer({
    min: year === now.year ? now.month : 1,
    max: 12,
  })
  // random day, keep in future if using current month
  const day = c.integer({
    min: month === now.month ? now.day : 1,
    max: now.daysInMonth,
  })

  // create start, create end time from start
  const start = DateTime.fromObject({ year, month, day }).startOf('day')
  const end = start
    .plus({
      days: c.integer({ min: 1, max: 31 }),
    })
    .endOf('day')

  const duration = Interval.fromDateTimes(
    start,
    end.minus({ minute: 1 }),
  ).toDuration('hours')

  return [start.toFormat(dtfmt), end.toFormat(dtfmt), round(duration.hours, 2)]
}

function testTemporarySchedule(screen: ScreenFormat): void {
  let schedule: Schedule
  let manualAddUser: User
  let graphQLAddUser: User
  let schedAssignmentUser: User
  beforeEach(() => {
    cy.fixture('users').then((u) => {
      manualAddUser = u[0]
      graphQLAddUser = u[1]
      schedAssignmentUser = u[2]

      cy.createSchedule().then((s: Schedule) => {
        schedule = s
        cy.visit('/schedules/' + s.id)
      })
    })
  })

  // todo: start with shifts on schedule and check they disappear after creating
  it('should create a temporary schedule', () => {
    // check calendar for original shift in weekly view
    // this allows us to compare shift times with a user's
    // name in the same div

    // open form
    cy.get('[data-cy="new-temp-sched"]').click()

    // fill out step 1 start and end times
    const [start, end, duration] = makeIntervalDates()
    cy.dialogForm({ start, end }, 'div[data-cy="sched-times-step"]')

    // go to step 2
    cy.get('[data-cy="loading-button"]').contains('Next').click()
    cy.get('div[data-cy="add-shifts-step"]').should('be.visible')

    // add shift for full duration
    cy.dialogForm(
      {
        start,
        end: duration,
        userID: manualAddUser.name,
      },
      'div[data-cy="add-shifts-step"]',
    )

    // verify shift doesn't exist in list yet
    cy.get('[data-cy="shifts-list"]').should('not.contain', manualAddUser.name)

    // click add shift button
    cy.get('button[title="Add Shift"]').click()

    // verify shift shows up in list
    cy.get('[data-cy="shifts-list"]').should('contain', manualAddUser.name)

    // click submit
    cy.dialogFinish('Submit')

    // go to correct month in calendar, using URL
    cy.visit(
      '/schedules/' +
        schedule.id +
        '?start=' +
        DateTime.fromISO(start).toFormat('yyyy-MM-dd') +
        'T07%3A00%3A00.000Z',
    )

    // check temp sched length in calendar
    cy.get('div').contains('Temporary Schedule').trigger('mouseover')
    cy.get('div[data-cy="shift-tooltip"]').should('be.visible')
    cy.get('button[data-cy="edit-temp-sched"]').should('be.visible')
    cy.get('button[data-cy="delete-temp-sched"]').should('be.visible')

    // check new shift + its tooltip exists in calendar
    cy.get('div').contains(manualAddUser.name).trigger('mouseover')
    cy.get('div[data-cy="shift-tooltip"]').should('be.visible')

      // todo
      // find by day then name to verify as temporary? (eq[0] since business logic = should always be sorted as first in calendar)
      // check by color being green
  })

  it.only('should edit a temporary schedule', () => {
    // create temporary schedule in graphql
    cy.createTemporarySchedule(schedule.id).then(() => {
      cy.reload()

      // hover over temporary sched span
      cy.get('div').contains('Temporary Schedule').trigger('mouseover')
      cy.get('div[data-cy="shift-tooltip"]').should('be.visible')

      // click edit button
      cy.get('button[data-cy="edit-temp-sched"]').click()

      // verify shift is in list
      cy.get('[data-cy="shifts-list"]').should('contain', graphQLAddUser.name)

      // click delete button in step 2
      cy.get('[data-cy="shifts-list"] li').contains(graphQLAddUser.name).eq(0).parent().parent().siblings().click()

      // verify shift was deleted from list
      cy.get('[data-cy="shifts-list"]').should('not.contain', graphQLAddUser.name)

      // add shift with new user
      cy.dialogForm({ userID: manualAddUser.name }, 'div[data-cy="add-shifts-step"]')
  
      // verify shift doesn't exist in list yet
      cy.get('[data-cy="shifts-list"]').should('not.contain', manualAddUser.name)
  
      // click add shift button
      cy.get('button[title="Add Shift"]').click()
  
      // verify shift shows up in list
      cy.get('[data-cy="shifts-list"]').should('contain', manualAddUser.name)
  
      // click submit
      cy.dialogFinish('Submit')

      cy.reload() // ensure calendar update

      // check new shift + its tooltip exists in calendar
      cy.get('div').contains(manualAddUser.name).trigger('mouseover')
      cy.get('div[data-cy="shift-tooltip"]').should('be.visible')

      // todo
      // find by day then name to verify as temporary? (eq[0] since business logic = should always be sorted as first in calendar)
      // check by color being green
    })
  })

  it('should delete a temporary schedule', () => {
    // create temporary schedule (with an active always active assignment) in graphql
    // hover over temporary sched span
    // click delete button in tooltip
    // click confirm button in dialog
    // check temporary sched gone in calendar
    // check old shifts show again
  })

  it('should be able to add multiple shifts on step 2', () => {
    // fill out step 1 start and end times
    // go to step 2
    // add shift
    // verify
    // add shift
    // verify
    // add shift
    // verify
    // verify list is sorted on right
  })

  it('should toggle timezone', () => {
    // get local tz and compare to schedule tz
    // fill in start and end
    // click toggle timezone to switch to schedule tz
    // check values of start/end display with schedule tz
    // click next button
    // check toggle still active
    // click toggle button to go back to local tz
    // click back button
    // check toggle is off
    // checkvalues of start/end display with local tz
  })

  it('should toggle duration field', () => {
    // create temporary schedule in graphql
    // hover over temporary sched span
    // click edit button
    // change duration field
    // click toggle
    // verify end date-time is updated with new duration
    // change date-time
    // click toggle
    // verify duration is updated from new time
  })

  it('should refill a shifts info after deleting in step 2', () => {
    // create temporary schedule in graphql
    // hover over temporary sched span
    // click edit button
    // click delete button in step 2
    // verify input fields have deleted shift's values
  })

  it('should go back and forth between steps', () => {
    // fill in step 1
    // click next button
    // verify on step 2
    // click back button
    // verify back on step 1
  })

  it('should cancel and close form', () => {
    // click cancel on step 1
    // verify dialog closed
  })
}

testScreen('temporary Schedule', testTemporarySchedule)
