import React, { useState, useEffect } from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  useQuery,
} from "@apollo/client";
import i18n from "i18next";
import { useTranslation, initReactI18next } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";
import "./App.css";

const client = new ApolloClient({
  uri: "https://rickandmortyapi.com/graphql",
  cache: new InMemoryCache(),
});

const CHARACTER_QUERY = gql`
  query GetCharacters($page: Int, $status: String, $species: String) {
    characters(page: $page, filter: { status: $status, species: $species }) {
      info {
        next
      }
      results {
        id
        name
        status
        species
        gender
        origin {
          name
        }
      }
    }
  }
`;

const resources = {
  en: {
    translation: {
      name: "Name",
      status: "Status",
      species: "Species",
      gender: "Gender",
      origin: "Origin",
      language: "Language",
      loadMore: "Load More",
      alive: "Alive",
      dead: "Dead",
      unknown: "Unknown",
      all: "All",
      rickAndMorty: "Rick and Morty",
    },
  },
  de: {
    translation: {
      name: "Name",
      status: "Status",
      species: "Spezies",
      gender: "Geschlecht",
      origin: "Herkunft",
      language: "Sprache",
      loadMore: "Mehr Laden",
      alive: "Lebendig",
      dead: "Tot",
      unknown: "Unbekannt",
      all: "Alle",
      rickAndMorty: "Rick und Morty",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

function Characters() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [allCharacters, setAllCharacters] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [pendingSpecies, setPendingSpecies] = useState("");

  const { loading, error, data, fetchMore, refetch } = useQuery(CHARACTER_QUERY, {
    variables: { page: 1, status: statusFilter, species: speciesFilter },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    setAllCharacters([]);
    setPage(1);
    refetch({ page: 1, status: statusFilter, species: speciesFilter }).then((res) => {
      const results = res.data?.characters?.results || [];
      setAllCharacters(results);
    });
  }, [statusFilter, speciesFilter, refetch]);

  useEffect(() => {
    if (data?.characters?.results) {
      setAllCharacters(data.characters.results);
    }
  }, [data]);

  const loadMore = () => {
    fetchMore({
      variables: {
        page: page + 1,
        status: statusFilter,
        species: speciesFilter,
      },
    }).then((res) => {
      const newResults = res.data?.characters?.results || [];
      setAllCharacters((prev) => [...prev, ...newResults]);
      setPage(page + 1);
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setSpeciesFilter(pendingSpecies);
    }
  };

  const handleSpeciesChange = (e) => {
    setPendingSpecies(e.target.value);
  };

  if (loading && allCharacters.length === 0) return <p>{t("loadMore")}...</p>;
  if (error) return <p>{t("loadMore")} Error loading characters 😢</p>;

  return (
    <div className="container">
      <h1>{t("rickAndMorty")} Characters</h1>

      <div className="filters">
        <label>
          {t("status")}
          <select
            onChange={(e) => setStatusFilter(e.target.value)}
            value={statusFilter}
          >
            <option value="">{t("all")}</option>
            <option value="Alive">{t("alive")}</option>
            <option value="Dead">{t("dead")}</option>
            <option value="Unknown">{t("unknown")}</option>
          </select>
        </label>

        <label>
          {t("species")}
          <input
            type="text"
            placeholder={t("species")}
            value={pendingSpecies}
            onChange={handleSpeciesChange}
            onKeyDown={handleKeyPress}
          />
        </label>
      </div>

      <InfiniteScroll
        dataLength={allCharacters.length}
        next={loadMore}
        hasMore={!!data?.characters?.info?.next}
        loader={<h4>{t("loadMore")}...</h4>}
        endMessage={
          <p style={{ textAlign: "center" }}>
            {t("loadMore")} - No more characters
          </p>
        }
      >
        <div className="table-container">
          <table className="character-table">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("status")}</th>
                <th>{t("species")}</th>
                <th>{t("gender")}</th>
                <th>{t("origin")}</th>
              </tr>
            </thead>
            <tbody>
              {allCharacters.map((char) => (
                <tr key={char.id}>
                  <td>{char.name}</td>
                  <td>{t(char.status.toLowerCase())}</td>
                  <td>{char.species}</td>
                  <td>{char.gender}</td>
                  <td>{char.origin.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InfiniteScroll>

      <footer>
        <button onClick={() => i18n.changeLanguage("en")}>English</button>
        <button onClick={() => i18n.changeLanguage("de")}>Deutsch</button>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ApolloProvider client={client}>
      <Characters />
    </ApolloProvider>
  );
}
