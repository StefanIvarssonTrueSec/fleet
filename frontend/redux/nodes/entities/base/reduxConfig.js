import { noop } from 'lodash';
import { normalize, arrayOf } from 'normalizr';

const initialState = {
  loading: false,
  errors: {},
  data: {},
};

const reduxConfig = ({
  createFunc = noop,
  entityName,
  loadFunc,
  parseFunc,
  schema,
  updateFunc,
}) => {
  const actionTypes = {
    CREATE_FAILURE: `${entityName}_CREATE_FAILURE`,
    CREATE_REQUEST: `${entityName}_CREATE_REQUEST`,
    CREATE_SUCCESS: `${entityName}_CREATE_SUCCESS`,
    LOAD_FAILURE: `${entityName}_LOAD_FAILURE`,
    LOAD_REQUEST: `${entityName}_LOAD_REQUEST`,
    LOAD_SUCCESS: `${entityName}_LOAD_SUCCESS`,
    UPDATE_FAILURE: `${entityName}_UPDATE_FAILURE`,
    UPDATE_REQUEST: `${entityName}_UPDATE_REQUEST`,
    UPDATE_SUCCESS: `${entityName}_UPDATE_SUCCESS`,
  };

  const createFailure = (errors) => {
    return {
      type: actionTypes.CREATE_FAILURE,
      payload: { errors },
    };
  };
  const createRequest = { type: actionTypes.CREATE_REQUEST };
  const createSuccess = (data) => {
    return {
      type: actionTypes.CREATE_SUCCESS,
      payload: { data },
    };
  };

  const loadFailure = (errors) => {
    return {
      type: actionTypes.LOAD_FAILURE,
      payload: { errors },
    };
  };
  const loadRequest = { type: actionTypes.LOAD_REQUEST };
  const loadSuccess = (data) => {
    return {
      type: actionTypes.LOAD_SUCCESS,
      payload: { data },
    };
  };

  const updateFailure = (errors) => {
    return {
      type: actionTypes.UPDATE_FAILURE,
      payload: { errors },
    };
  };
  const updateRequest = { type: actionTypes.UPDATE_REQUEST };
  const updateSuccess = (data) => {
    return {
      type: actionTypes.UPDATE_SUCCESS,
      payload: { data },
    };
  };

  const parsedResponse = (responseArray) => {
    if (!parseFunc) return responseArray;

    return responseArray.map(response => {
      return parseFunc(response);
    });
  };

  const create = (...args) => {
    return (dispatch) => {
      dispatch(createRequest);

      return createFunc(...args)
        .then(response => {
          if (!response) return [];

          const { entities } = normalize(parsedResponse([response]), arrayOf(schema));

          return dispatch(createSuccess(entities));
        })
        .catch(response => {
          const { errors } = response;
          const { error } = response.message || {};
          const errorMessage = errors || error;

          dispatch(createFailure(errorMessage));

          throw error;
        });
    };
  };

  const load = (...args) => {
    return (dispatch) => {
      dispatch(loadRequest);

      return loadFunc(...args)
        .then(response => {
          if (!response) return [];

          const { entities } = normalize(parsedResponse(response), arrayOf(schema));

          return dispatch(loadSuccess(entities));
        })
        .catch(response => {
          const { errors } = response;

          dispatch(loadFailure(errors));
          throw response;
        });
    };
  };

  const update = (...args) => {
    return (dispatch) => {
      dispatch(updateRequest);

      return updateFunc(...args)
        .then(response => {
          if (!response) return {};
          const { entities } = normalize(parsedResponse([response]), arrayOf(schema));

          return dispatch(updateSuccess(entities));
        })
        .catch(response => {
          const { errors } = response;

          dispatch(updateFailure(errors));
          throw response;
        });
    };
  };

  const actions = {
    create,
    load,
    update,
  };

  const reducer = (state = initialState, { type, payload }) => {
    switch (type) {
      case actionTypes.CREATE_REQUEST:
      case actionTypes.LOAD_REQUEST:
      case actionTypes.UPDATE_REQUEST:
        return {
          ...state,
          loading: true,
        };
      case actionTypes.CREATE_SUCCESS:
      case actionTypes.UPDATE_SUCCESS:
      case actionTypes.LOAD_SUCCESS:
        return {
          ...state,
          loading: false,
          data: {
            ...state.data,
            ...payload.data[entityName],
          },
        };
      case actionTypes.CREATE_FAILURE:
      case actionTypes.UPDATE_FAILURE:
      case actionTypes.LOAD_FAILURE:
        return {
          ...state,
          loading: false,
          errors: payload.errors,
        };
      default:
        return state;
    }
  };

  return {
    actions,
    reducer,
  };
};

export default reduxConfig;