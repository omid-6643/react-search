import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";
//! we definde rootUrl to use as axios
const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

// provider consumeer - GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //! request loading
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  //! error
  const [error, setError] = useState({ show: false, msg: "" });

  //! search func

  const searchGithubUser = async (user) => {
    //! for change all data we should use all usestat that have mock
    toggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(response);
    if (response) {
      //! for user mock
      setGithubUser(response.data);
      const { login, followers_url } = response.data;
      //* all we do in here is good but we have problem with loading , first the repos load then the followers loaded so we use the other way
      // //! for repos mock
      // //! https://api.github.com/users/john-smilga/repos?per_page=100
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) =>
      //   setRepos(response.data)
      // );
      // //! for followrs mock
      // //! https://api.github.com/users/john-smilga/followers
      // axios(`${followers_url}?per_page=100`).then((response) =>
      //   setFollowers(response.data)
      // );

      //! for both repos and followers in same time
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      }).catch(err => console.log(err))
    } else {
      toggleError(true, "there is no user with that username");
    }
    checkRequests();
    setLoading(false);
  };
  //! check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "sorry, you have excceded your hourly rate limit!");
        }
      })
      .catch((err) => console.log(err));
  };
  function toggleError(show = false, msg) {
    setError({ show, msg });
  }
  //! error
  useEffect(checkRequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
