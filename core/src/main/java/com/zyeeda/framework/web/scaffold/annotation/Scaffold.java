package com.zyeeda.framework.web.scaffold.annotation;

import static java.lang.annotation.ElementType.TYPE;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

/**
 * @author guyong
 */
@Target(TYPE)
@Retention(RUNTIME)
public @interface Scaffold {

    String path();
    String[] excludes() default {};
    Filters[] filters() default {@Filters};
    
}
