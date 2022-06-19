import React, { useEffect, useState } from "react";
import "./Employment.scss";
import PhoneInput from "react-phone-input-2";
import TextField from "@mui/material/TextField";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Typography from "@mui/material/Typography";
import "react-phone-input-2/lib/material.css";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { Link, useNavigate, useParams } from "react-router-dom";
import SaveIcon from "@mui/icons-material/Save";
import Files from "react-files";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Fab,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import {
  AddLinkOutlined,
  Copyright,
  Upload,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import DateAdapter from "@mui/lab/AdapterDateFns";
import { DatePicker, LocalizationProvider } from "@mui/lab";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { usePlacesWidget } from "react-google-autocomplete";
import { styled } from "@mui/material/styles";

import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Stack from "@mui/material/Stack";
import FileUpload from "react-material-file-upload";
import UploadFiles from "./UploadFiles";
import axios from "axios";
import useAxiosPrivate from "../../../hooks/useAxiosPrivate";
import { useCookies } from "react-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Input = styled("input")({
  display: "none",
});

export function getQueryStringParam(paramName) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(paramName);
}

const Employment = () => {
  let navigate = useNavigate();
  const [overallexpenseValue, setOverallexpensesValue] = React.useState("");

  const [urls, setUrls] = useState([]);


  const [overallexpenses, setOverallexpenses] = React.useState(false);
  const [expenseListHide, setExpenseListHide] = React.useState(false);

  const axiosPrivate = useAxiosPrivate();
  const [isLoading, setLoading] = React.useState(false);
  const [expensesList, setExpensesList] = React.useState([
    {
      description: "",
      amount: 0,
    },
  ]);
  const params = useParams();
  const [cookies, setCookie] = useCookies();
  const { ref, autocompleteRef } = usePlacesWidget({
    apiKey: "YOUR_GOOGLE_MAPS_API_KEY",
    onPlaceSelected: (place) => {
      // console.log(place);
    },
  });

  const validationSchema = Yup.object().shape({
    employerName: Yup.string().required("Employer name must not be empty."),
    payee: Yup.string().required("Payee Ref Number must not be empty."),
    incomeFrom: Yup.string().required("Income from P60/P45 must not be empty."),
    taxFrom: Yup.string().required("Tax from P60/P45 must not be empty"),
  });

  const formOptions = {
    mode: "onChange",
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employerName: "",
      payee: "",
      incomeFrom: "",
      taxFrom: "",
    },
  };

  const {
    register,
    handleSubmit,
    formState,
    reset,
    setValue,
    trigger,
    getValues,
  } = useForm(formOptions);
  const { errors } = formState;

  const packageId = getQueryStringParam("packageId");

  const postCall = (data) => {
    const response =  axiosPrivate.post("/EmploymentDetail", {
      orderId: params.orderId ? params.orderId : cookies.order.oderId,
      name: data.employerName,
      paye: data.payee,
      incomeFromP60_P45: data.incomeFrom,
      taxFromP60_P45: data.taxFrom,
      totalExpenses: overallexpenseValue
        ? parseInt(overallexpenseValue)
        : 0,
      expenses: expensesList.length===0
        ? []
        : expensesList.length===1 && expensesList[0].amount===0?[]: 
        [
            ...expensesList.map((n) => {
              return {
                description: n.description,
                amount: parseInt(n.amount),
              };
            }),
          ],
      attachments: [
        ...urls.map((n) => {
          return { url: n };
        }),
      ],
    });

    return response;
  }

  const putCall = (data) => {
    const response =  axiosPrivate.put("/EmploymentDetail", {
      id: packageId,
      orderId: params.orderId,
      name: data.employerName,
      paye: data.payee,
      incomeFromP60_P45: data.incomeFrom,
      taxFromP60_P45: data.taxFrom,
      totalExpenses: overallexpenseValue
        ? parseInt(overallexpenseValue)
        : 0,
      expenses: expensesList.length===0
        ? []
        : expensesList.length===1 && expensesList[0].amount===0?[]: 
        [
            ...expensesList.map((n) => {
              return {
                id: n.id,
                description: n.description,
                amount: parseInt(n.amount),
              };
            }),
          ],
      attachments: [
        ...urls.map((n) => {
          return { id:n.id, url: n.url };
        }),
      ],
    });

    return response;
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      
      const response = packageId? await putCall(data): await postCall(data);
      
      setLoading(false);
      toast.success(packageId?"Employment Details Edited Successfully":"Employment Details Saved Successfully");
      reset();
      setExpensesList([{ description: "", amount: 0 }]);
      setLoading(false);
      setUrls([]);
      setOverallexpensesValue("");
      if(packageId){
        navigate("/");
      }else{
        
      if (params.orderId) {
        navigate("/");
      } else {
       
        if (cookies.order.selectedPackages.length > 1) {
          
          const filteredEmployement = cookies.order.selectedPackages.filter(
            (n) => n.package.name === "Employment"
          );

          filteredEmployement[0].package.recordsAdded = true;

          const filteredOther = cookies.order.selectedPackages.filter(
            (n) => n.package.name !== "Employment"
          );
          const filtered = filteredOther.filter(
            (n) => n.package.recordsAdded !== true
          );

          setCookie(
            "order",
            {
              oderId: cookies.order.oderId,
              selectedPackages: [...filteredOther, ...filteredEmployement] ,
            },
            {
              path: "/",
            }
          );

          

          if (filtered.length > 0) {
            navigate(
              `/${filtered[0].package.name.toLowerCase().replace(/\s/g, "")}`
            );
          } else {
            navigate("/");
          }
        } else {
          navigate("/");
        }
      }
    }
    } catch (err) {
     
      setLoading(false);
      toast.error(err);
    }
  };

  const onSubmitAndAddAnother = async (data) => {
    setLoading(true);
    try {
      const response = await postCall(data);

      reset();
      setExpensesList([{ description: "", amount: 0 }]);
      setLoading(false);
      toast.success("Employment Details Saved Successfully");
      setUrls([]);
      setOverallexpensesValue("");
    } catch (err) {
      
     
      setLoading(false);
      toast.error(err);
    }
  };



  function handleChangeInput(i, event) {
    const values = [...expensesList];
    const { name, value } = event.target;
    values[i][name] = value;
    setExpensesList(values);
    if (value) {
      setOverallexpenses(true);

      setOverallexpensesValue(
        values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
      );
    } else {
      setOverallexpenses(false);
    }
  }

  function handleAddInput() {
    const values = [...expensesList];
    values.push({
      description: "",
      amount: 0,
    });
    setExpensesList(values);
    setOverallexpensesValue(
      expensesList.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
    );
  }

  function handleRemoveInput(i) {
    const values = [...expensesList];
    values.splice(i, 1);
    setExpensesList(values);
    setOverallexpensesValue(
      values.reduce((acc, curr) => acc + parseInt(curr.amount), 0)
    );
  }

  const handleUpload = (urlsComming) => {
    if(packageId){
      setUrls([...urls,...urlsComming.map(n=>{return {url:n}})]);
    }else{
      setUrls(urlsComming);
    }
  };

  const handleOverallExpenses = (e) => {
    setOverallexpensesValue(e.target.value);
    if (e.target.value) {
      setExpenseListHide(true);
    } else {
      setExpenseListHide(false);
    }
  };

 
  useEffect(() => {
    if (packageId) {
      // get user and set form fields
      getPackage(packageId);
    }
  }, [packageId]);

  const getPackage = async (packageId) => {
    setLoading(true);
    try {
      const response = await axiosPrivate.get(`/EmploymentDetail/${packageId}`);
      const fields = ["employerName", "payee", "incomeFrom", "taxFrom"];

      const packages = {
        employerName: response.data.result.name,
        payee: response.data.result.paye,
        incomeFrom: response.data.result.incomeFromP60_P45,
        taxFrom: response.data.result.taxFromP60_P45,
      };

      fields.forEach((field) => setValue(field, packages[field]));
     
      if(response.data.result.expenses.length > 0){
        setExpensesList([
          ...response.data.result.expenses.map((n) => {
            return { id:n.id, description: n.description, amount: n.amount };
          }),
        ]);
      }else{
        setExpensesList([{ description: "", amount: 0 }]);
      }
     
      setUrls([
        ...response.data.result.attachments.map((n) => {
          return{url: n.url, id: n.id};
        }),
      ]);
      setOverallexpensesValue(response.data.result.totalExpenses);
    } catch (err) {
      // console.log(err);
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="Employment">
      {isLoading ? (
        <CircularProgress />
      ) : (
        <form>
          <ToastContainer />
          <Container component="main" maxWidth="lg">
          <div className="back-button" onClick={() => navigate(-1)}>
            <ArrowBackIosNewIcon className="back-icon" />
            <h5 className="title is-5">Back</h5>
          </div>
            <Box
              sx={{
                // marginTop: 8,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                <LockOutlinedIcon />
              </Avatar> */}
              {/* <Typography component="h1" variant="h5">
                Sign up
              </Typography> */}
              <p className="title is-3">Employment Details</p>
              <Box sx={{ mt: 1 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="employer"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Employment
                    </InputLabel>
                    <TextField
                      name="employerName"
                      required
                      fullWidth
                      id="employerName"
                      //   label="Enter your employer name"
                      placeholder="Enter your employer name"
                      autoFocus
                      error={errors.employerName?.message}
                      {...register("employerName")}
                    />

                    <Typography variant="body2" color="error" align="left">
                      {errors.employerName?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Payee Ref Number
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="payee"
                      name="payee"
                      {...register("payee")}
                      placeholder="Payee Ref Number"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.payee?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Income from P60/P45
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="incomeFrom"
                      name="incomeFrom"
                      {...register("incomeFrom")}
                      type="number"
                      placeholder="Income from P60/P45"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.incomeFrom?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      required
                      sx={{ fontWeight: "bold" }}
                    >
                      Tax from P60/P45
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="taxFrom"
                      name="taxFrom"
                      {...register("taxFrom")}
                      type="number"
                      placeholder="Tax from P60/P45"
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.taxFrom?.message}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel htmlFor="payee" sx={{ fontWeight: "600" }}>
                      Expenses
                    </InputLabel>
                  </Grid>
                  <Grid item xs={12} sm={12}>
                    <InputLabel
                      htmlFor="payee"
                      required
                      // sx={{ fontWeight: "bold" }}
                    >
                      Overall expenses
                    </InputLabel>
                    <TextField
                      required
                      fullWidth
                      id="overallExpenses"
                      name="overallExpenses"
                      type={"number"}
                      onChange={handleOverallExpenses}
                      placeholder="Enter your overall expenses"
                      value={overallexpenseValue}
                      disabled={overallexpenses}
                    />
                    <Typography variant="body2" color="error" align="left">
                      {errors.taxFrom?.message}
                    </Typography>
                  </Grid>
                  {expensesList.map((field, idx) => (
                    <React.Fragment key={field + "-" + idx}>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Description
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="description"
                          name="description"
                          value={field.description}
                          // {...register("description")}
                          onChange={(e) => handleChangeInput(idx, e)}
                          placeholder="Description"
                          disabled={expenseListHide}
                        />
                        <Typography variant="body2" color="error" align="left">
                          {errors.lastName?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={5.5}>
                        <InputLabel htmlFor="payee" required>
                          Amount
                        </InputLabel>
                        <TextField
                          required
                          fullWidth
                          id="amount"
                          name="amount"
                          value={field.amount}
                          type="number"
                          // {...register("description")}
                          onChange={(e) => handleChangeInput(idx, e)}
                          // {...register("amount")}
                          placeholder="Amount"
                          disabled={expenseListHide}
                        />
                        <Typography variant="body2" color="error" align="left">
                          {errors.lastName?.message}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        
                      </Grid>
                    </React.Fragment>
                  ))}
                  <Grid item xs={12} sm={12}>
                    
                    {packageId && (
                      <>
                        <ol style={{ padding: "1rem" }}>
                          {urls.map((n) => (
                            <li key={n.id}>
                              <a target={"_blank"} href={n.url}>
                                {n.url}
                              </a>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Container>

          
        </form>
      )}
    </div>
  );
};

export default Employment;
