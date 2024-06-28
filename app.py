import streamlit as st
import requests


st.title("Nerdma Hack-AI-thon Applications")

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "session_token" not in st.session_state:
    st.session_state.session_token = None

if not st.session_state.authenticated:
    st.subheader("Please enter the access code to view the applications")
    access_code = st.text_input("Access Code", type="password")
    if st.button("Submit"):
        response = requests.post('https://squid-app-mdj7h.ondigitalocean.app/authenticate', json={"access_code": access_code})
        if response.status_code == 200:
            st.session_state.authenticated = True
            st.session_state.session_token = response.json().get("session_uuid")
            st.success("Access granted!")
        else:
            st.error("Invalid access code. Please try again.")


if st.session_state.authenticated:

    headers = {"Authorization": st.session_state.session_token}
    response = requests.get('https://squid-app-mdj7h.ondigitalocean.app/applications/v1', headers=headers)

    if response.status_code == 200:
        applications = response.json()
        if applications:
            for app in applications:
                with st.expander(f"Applicant: {app['first_name']} {app['last_name']}"):
                    st.write("First Name:", app['first_name'])
                    st.write("Last Name:", app['last_name'])
                    st.write("Phone Number:", app['phone_number'])
                    st.write("Email:", app['email'])
                    st.write("Company:", app['company'])
                    st.write("Experience Level:", app['experience_level'])
                    st.write("Track:", app['track'])
                    st.write("Team:", app['team'])
        else:
            st.write("No applicants")
    else:
        st.error("Failed to fetch applications.")
