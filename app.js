const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

function convertMovieDbObjectToResponseObject(DbObject) {
  return {
    movieId: DbObject.movie_id,
    directorId: DbObject.director_id,
    movieName: DbObject.movie_name,
    leadActor: DbObject.lead_actor,
  };
}
function convertDirectorDbObjectToResponseObject(DbObject) {
  return {
    directorId: DbObject.director_id,
    directorName: DbObject.director_name,
  };
}

app.get("/movies/", async (request, response) => {
  const getMovieNameQuery = `
        SELECT movie_name FROM movie;`;
  const movieNames = await db.all(getMovieNameQuery);
  response.send(
    movieNames.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
        INSERT INTO
            movie(director_id, movie_name, lead_actor)
        VALUES(
            ${directorId},
            '${movieName}',
            '${leadActor}'
        );`;
  const result = await db.run(postMovieQuery);
  const movieId = result.lastID;
  response.send("Movie Successfully Added");
});

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieNameWithIdQuery = `
        SELECT 
            * 
        FROM 
            movie
        WHERE
            movie_id = ${movieId};`;
  const movie = await db.get(getMovieNameWithIdQuery);
  response.send(convertMovieDbObjectToResponseObject(movie));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const putMovieDetailsQuery = `
        UPDATE 
            movie
        SET 
           director_id = ${directorId},
           movie_name = '${movieName}',
           lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};`;
  await db.run(putMovieDetailsQuery);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM
            movie
        WHERE
            movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

app.get("/directors/", async (request, response) => {
  const getDirectorsName = `
        SELECT 
            *
        FROM
            director;`;
  const directors = await db.all(getDirectorsName);
  response.send(
    directors.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirector = `
        SELECT 
            movie_name
        FROM
            movie
        WHERE 
            director_id = ${directorId};`;
  const directorMovies = await db.all(getDirector);
  response.send(
    directorMovies.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

module.exports = app;
