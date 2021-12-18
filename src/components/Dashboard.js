import React, { Component } from "react";

import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";
import { isPlainObject } from "lodash/fp";
import axios from "axios";
import { getTotalInterviews, getLeastPopularTimeSlot, getMostPopularDay, getInterviewsPerDay } from "helpers/selectors";
import { setInterview } from "helpers/reducers";
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

class Dashboard extends Component {
  state = { 
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},

  }
    selectPanel(id) {
      this.setState(previousState => ({
        focused: previousState.focused !== null ? null : id
      }));
    }

    componentDidMount() {
      const focused = JSON.parse(localStorage.getItem("focused"));
      this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
      this.socket.onmessage = event => {
        const data = JSON.parse(event.data);
      
        if (typeof data === "object" && data.type === "SET_INTERVIEW") {
          this.setState(previousState =>
            setInterview(previousState, data.id, data.interview)
          );
        }
      };
  
      if (focused) {
        this.setState({ focused });
      }

      Promise.all([
        axios.get("/api/days"),
        axios.get("/api/appointments"),
        axios.get("/api/interviewers")
        
      ]).then(([days, appointments, interviewers]) => {
        this.setState({
          loading: false,
          days: days.data,
          appointments: appointments.data,
          interviewers: interviewers.data
        });
      });
    }
  
    componentDidUpdate(previousProps, previousState) {
      if (previousState.focused !== this.state.focused) {
        localStorage.setItem("focused", JSON.stringify(this.state.focused));
      }
    }
    componentWillUnmount() {
      this.socket.close();
    }

  render() {
    const dashboardClasses = classnames("dashboard", {"dashboard--focused": this.state.focused});
    const children = data.filter(obj => this.state.focused === null || this.state.focused === obj.id)
    .map((obj) => {
      return <Panel key={obj.id} label={obj.label} value={obj.getValue(this.state)} onSelect={event=>this.selectPanel(obj.id)} />;
    })
    if(this.state.loading) {
      return <Loading />
    }
    return <main className={dashboardClasses}>{children}</main>;
  }
}

export default Dashboard;
